/** @flow */

import R from "ramda";

import { ireduce } from '../../Helpers/Functions';


export const getParsedFromInput = R.head
export const getLinesFromInput = R.last

const parser = (parseLine, makeOutput, terminator=R.identity) => (input) =>
      R.converge(makeOutput,
                 [getParsedFromInput,
                  getLinesFromInput,
                  R.pipe(getLinesFromInput,
                         parseLines(parseLine, terminator))])(input)

const parseLines = (parseLine, terminator) =>
      ireduce(
        R.useWith(R.pipe(computeNextAccumulatorState, terminator),
                  [R.identity, parseLine, R.identity]), [])

const computeNextAccumulatorState = (acc, parsedObj, lineNr) =>
      R.isEmpty(parsedObj) ? acc : acc.concat([{ lineNr, parsedObj }]);

export { parser }
