/** @flow */

import R from "ramda";

import { hungryLineParser } from '../GenericParsers/HungryLineParser';
import { lazyLineParser } from '../GenericParsers/LazyLineParser';
import { linesRangeParser } from '../GenericParsers/LinesRangeParser';
import { nodeMetadataR } from '../Regex';
import { nodeMetadataT } from '../Transformations';

const drawersParser = linesRangeParser(nodeMetadataR.drawer, nodeMetadataT.drawer.fromOrg);

const closedDateParser = lazyLineParser(nodeMetadataR.closed,
                                        nodeMetadataT.closed.fromOrg,
                                        "timestamps")
const scheduledParser = lazyLineParser(nodeMetadataR.scheduled,
                                       nodeMetadataT.scheduled.fromOrg,
                                       "timestamps");
const deadlineParser = lazyLineParser(nodeMetadataR.deadline,
                                      nodeMetadataT.deadline.fromOrg,
                                      "timestamps");

const activeTimestampParser = hungryLineParser(
  nodeMetadataR.activeTimestamp,
  nodeMetadataT.activeTimestamp.fromOrg,
  "timestamps");

const activeTimestampRangeParser = hungryLineParser(
  nodeMetadataR.activeTimestampRange,
  nodeMetadataT.activeTimestampRange.fromOrg,
  "timestamps");


export const nodeMetadataParser = (lines) => {
  const innerRepr = [[], lines];
  return R.pipe(
    drawersParser,
    scheduledParser,
    deadlineParser,
    closedDateParser,
    activeTimestampRangeParser,
    activeTimestampParser,
  )(innerRepr)};
