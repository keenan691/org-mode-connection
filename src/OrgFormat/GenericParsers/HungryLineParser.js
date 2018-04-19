import R from "ramda";

import { parser } from './Common';

// Wycina z objektu z liniami bloki oddzielone dwoma wyrażeniami regularnymi.

const hungryLineParser = (regex, transform, wrapIn=null) => {
  const parseLine = (input) => {
    let results = [], result;
    let x = 0;
    while ((result = regex.exec(input))) {
      results.push(transform(...result))}
    return results};

  // If we have found two objects, slice them from input
  // Also contain information of drawers name
  const makeOutput = (inputObjects, inputLines, parserOutput) => {
    if (parserOutput.length > 0) {
      inputObjects.push({
        [wrapIn]: R.pipe(
          R.pluck('parsedObj'),
          R.unnest,
          R.uniq)
        (parserOutput)})}
    return [inputObjects, inputLines]}

  return parser(parseLine, makeOutput)};

export { hungryLineParser }
