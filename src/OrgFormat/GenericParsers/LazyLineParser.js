/** @flow */

import R from "ramda";

import { parser } from './Common';

// Parses only first line

const lazyLineParser = (regex, transform, wrapIn=null) => {
  const terminator = R.reduced;

  const parseLine = R.pipe(
    R.match(regex),
    R.unless(R.isEmpty,
             R.apply(transform)))

  const makeOutput = (inputObjects, inputLines, parserOutput) => {
    console.log(parserOutput)
    R.forEach(
      (parsed) => {
        inputObjects.push(
          { [wrapIn]: [parsed.parsedObj] })
        inputLines.splice(parsed.lineNr, 1)}
      , parserOutput)
    return [inputObjects, inputLines]}
  return parser(parseLine, makeOutput, terminator)}

export { lazyLineParser }
