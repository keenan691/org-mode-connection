import R from "ramda";

import { headlineR } from './Regex';
import { imap } from '../Helpers/Functions';
import { preParseHeadline } from './AtomicParsers/HeadlineParser';

export const rangeAsObj = (range) => ({ range: range }); // make unviersal func as obj
const isNode = R.test(headlineR.head);

const getHeadlinesLineNumbers = R.pipe(
  R.filter(R.pipe(R.last, isNode)),
  R.map(R.head));

const addLineNumbers = imap((line, idx) => [idx, line]);

export const getNodesLineRanges = (lines) => R.pipe(
  addLineNumbers,
  getHeadlinesLineNumbers,
  R.converge(R.zip, [
    R.identity,
    R.pipe(R.drop(1), R.append(lines.length))]))(lines);

const mapRangesToContent = (lines, ranges) => ranges.map(
  (range, position) => R.merge(
    preParseHeadline(lines[range[0]]),
    { position,
      rawContent: lines.slice(range[0]+1, range[1]).join("\n"),
      range: range }));

export const extractNodesFromLines = R.converge(
  mapRangesToContent, [R.identity, getNodesLineRanges])

export const extractPreNodeContentFromLines = R.takeWhile(R.complement(isNode))
