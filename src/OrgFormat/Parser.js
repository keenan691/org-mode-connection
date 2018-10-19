import R from "ramda";

import { deepMerge } from '../Helpers/Functions';
import { extractNodesFromLines } from '../OrgFormat/NodesExtractor';
import { extractPreNodeContentFromLines } from './NodesExtractor';
import { fileMetadataR } from './Regex';
import { nodeMetadataParser } from './AtomicParsers/NodeMetadataParser';
import { parseContent } from './AtomicParsers/NodeContentParser';
import { parseHeadline } from './AtomicParsers/HeadlineParser';
import { rlog } from '../Helpers/Debug';

const useRestAsContentAndRemoveInput = (input) => R.append(
  { content: input[1].join('\n') }, input[0]);

export const parseNode = R.converge(
  (...args) => R.mergeAll(args), [

    R.pipe(R.prop("rawHeadline"),
           parseHeadline),

    R.pipe(R.prop("rawContent"),
           R.split('\n'),
           nodeMetadataParser,
           useRestAsContentAndRemoveInput,
           deepMerge),

    R.pick(["range",
            // "rawHeadline",
            // "rawContent",
            "level",
            "position"])])

const mapMetadataLinesToObject = R.pipe(
  R.map(R.pipe(
    R.match(fileMetadataR),
    R.drop(1))),
  R.fromPairs)

export const parseFileContent = R.pipe(
  extractPreNodeContentFromLines,
  R.partition(R.test(fileMetadataR)),
  R.applySpec({
    metadata: R.pipe(R.head,
                     mapMetadataLinesToObject),
    description: R.pipe(R.last,
                        R.join('\n')),}))

const mergeNodeDefaults = R.merge({
  todo: null,
  priority: null,
  drawers: null,
  tags: [],
  timestamps: []
});

export const parseNodes = R.pipe(
  extractNodesFromLines,
  R.map(R.pipe(parseNode,
               R.evolve({
                 drawers: JSON.stringify
               }),
               mergeNodeDefaults)));

export const parse = R.applySpec({
  nodes: parseNodes,
  file: parseFileContent})
