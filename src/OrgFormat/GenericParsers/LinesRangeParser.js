/** @flow */

import R from "ramda";

import { parser } from './Common';
import { selfChangingRegexMatch } from '../../Helpers/Functions';

// Wycina z objektu z liniami bloki oddzielone dwoma wyrażeniami regularnymi.

const linesRangeParser = (regex, transform, wrapIn=null) => {
  const terminator = (acc) => acc.length == 2 ? R.reduced(acc) : acc;

  // Transform will extract drawer name from first tag
  const parseLine = R.pipe(
    selfChangingRegexMatch(regex),
    R.unless(R.isEmpty, R.apply(transform)))

  const makeOutput = (inputObjects, inputLines, parserOutput) => {
    const isOdd = R.modulo(R.__, 2)
    const prepare = R.pipe(
      R.when(isOdd, R.dropLast(1)),
      R.splitEvery(2))

    R.forEach(
      (parsed) => {
        const objStart = parsed[0]
        const objEnd = parsed[1]
        const objName = objStart.parsedObj
        const drawerContent = inputLines.splice(objStart.lineNr, objEnd.lineNr+1)
        const obj = { drawers: { [objName]: drawerContent.slice(1,-1) } }
        inputObjects.push(obj)}
      , prepare(parserOutput))
    return [inputObjects, inputLines]}

  return parser(parseLine, makeOutput, terminator)}

export { linesRangeParser }
