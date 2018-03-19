/** @flow */

import R from "ramda";

export const nullWhenEmpty = R.ifElse(R.isEmpty, R.F, R.identity);
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
    console.log(res);
    return res}}
