/** @flow */

import R from "ramda";

const pipePromise = R.curry(
  (list,acc) => list.reduce( (acc,fn) => acc.then(fn), Promise.resolve(acc) ));

export const promisePipe = R.compose( pipePromise, R.unapply(R.flatten) );
export const deepMerge = R.reduce(R.mergeDeepWith(R.concat), [])
export const nullWhenEmpty = obj => obj.length === 0 ? null : obj
export const ireduce = R.addIndex(R.reduce)
export const imap = R.addIndex(R.map);
export const makeRegex = (flags='') =>  (...strings) => new RegExp(R.pipe(R.map(s => s.source), R.join(''))(strings), flags)
export const cycler = (counter, max) => () => counter < max ? counter++ : counter = 0;

// Find first regex
// If it is found start to search ending regex
// Collect two results in array
// Terminates reducer when there are two regex found
export const selfChangingRegexMatch = (regexList) => {
  let counter = 0;
  const cycle = cycler(counter, regexList.length)

  return (lineToMatch) => {
    const regex = regexList[counter]
    const res = R.match(regex, lineToMatch)
    if (!R.isEmpty(res)) { cycle() }
    return res}}
