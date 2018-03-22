/** @flow */
import R from "ramda";

import { extractNodesFromLines } from '../OrgFormat/NodesExtractor';
import { nodeMetadataParser } from './AtomicParsers/NodeMetadataParser';
import { parseContent } from './AtomicParsers/NodeContentParser';
import { parseHeadline } from './AtomicParsers/HeadlineParser';
import { rlog } from '../Helpers/Debug';

// * TODO add metadata to file object

// * TODO extract file content and metadata
// * parse nodes

const useRestAsContentAndRemoveInput = (input) => R.append(
  { content: input[1].join('\n') }, input[0]);

export const parseNode = R.converge(
  (...args) => R.mergeAll(args), [
    R.pipe(R.prop("rawHeadline"), parseHeadline),
    R.pipe(R.prop("rawContent"), R.split('\n'),nodeMetadataParser, useRestAsContentAndRemoveInput, R.mergeAll),
    R.pick(["range", "rawHeadline", "rawContent", "level", "position", "originalPosition"])])

const parseNodes = R.pipe(
  extractNodesFromLines,
  R.map(parseNode)
);

export const parse = lines => parseNodes(lines);
