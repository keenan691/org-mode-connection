/** @flow */

import R from "ramda";

import { parser } from './Common';
import { selfChangingRegexMatch } from '../../Helpers/Functions';

// Slices area delimited by two regex expressions

const isOdd = R.pipe(R.length, R.modulo(R.__, 2))
const dropRetardedDrawersAndGroupByTwo = R.pipe(
  R.when(isOdd, R.dropLast(1)),
  R.splitEvery(2))

const linesRangeParser = (regex, transform, wrapIn=null) => {
  const parseLine = R.pipe(
    selfChangingRegexMatch(regex),
    R.unless(R.isEmpty, R.apply(transform)))

  const makeOutput = (inputObjects, inputLines, parserOutput) => {
    let drawers = []
    let nrOfAlreadySlicedLines = 0
    R.forEach((parsed) => {
      const lineStart = parsed[0].lineNr - nrOfAlreadySlicedLines
      const lineEnd = parsed[1].lineNr - nrOfAlreadySlicedLines + 1
      nrOfAlreadySlicedLines += lineEnd - lineStart

      const objName = parsed[0].parsedObj
      const drawerContent = inputLines.splice(lineStart, lineEnd - lineStart)
      drawers.push({ [objName]: drawerContent.slice(1, -1) })

    } , dropRetardedDrawersAndGroupByTwo(parserOutput))

    if (drawers.length > 0) inputObjects.push({ drawers })

    return [inputObjects, inputLines]}
  return parser(parseLine, makeOutput)}
export { linesRangeParser }
