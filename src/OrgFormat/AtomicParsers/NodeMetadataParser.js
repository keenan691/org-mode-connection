/** @flow */

import R from 'ramda';

import { hungryLineParser } from '../GenericParsers/HungryLineParser';
import { lazyInLineParser } from '../GenericParsers/LazyInLineParser';
import { lazyLineParser } from '../GenericParsers/LazyLineParser';
import { linesRangeParser } from '../GenericParsers/LinesRangeParser';
import { nodeMetadataR } from '../Regex';
import { nodeMetadataT } from '../Transforms';
import { rlog } from '../../Helpers/Debug';

const drawersParser = linesRangeParser(
  nodeMetadataR.drawer,
  nodeMetadataT.drawer.fromOrg
);

const closedDateParser = lazyInLineParser(
  nodeMetadataR.closed,
  nodeMetadataT.closed.fromOrg,
  'timestamps'
);
const scheduledParser = lazyInLineParser(
  nodeMetadataR.scheduled,
  nodeMetadataT.scheduled.fromOrg,
  'timestamps'
);
const deadlineParser = lazyInLineParser(
  nodeMetadataR.deadline,
  nodeMetadataT.deadline.fromOrg,
  'timestamps'
);

const activeTimestampParser = hungryLineParser(
  nodeMetadataR.activeTimestamp,
  nodeMetadataT.activeTimestamp.fromOrg,
  'timestamps'
);

const activeTimestampRangeParser = hungryLineParser(
  nodeMetadataR.activeTimestampRange,
  nodeMetadataT.activeTimestampRange.fromOrg,
  'timestamps'
);

export const nodeMetadataParser = R.pipe(
  scheduledParser,
  deadlineParser,
  closedDateParser,
  drawersParser,
  activeTimestampRangeParser,
  activeTimestampParser
);
