/** @flow */

import { makeRegex } from '../Helpers/Functions';

const mr = makeRegex();
const mrg = makeRegex('g');
const timeR = /(\d{2}:\d{2})/;
const datetimeR = /(\d+)\-(\d+)\-(\d+)\s+.{3}\s*(\d{2}:\d{2})?(-\d{2}:\d{2})?/;
const repeaterR = /\s*([\+\.]+\d+[ywmdh])?/;
const warningPeriodR = /\s*(-\d+[ywmdh])?/;
const activeTimestamp = mr(/\</, datetimeR, repeaterR, /\>/);
const inactiveTimestamp = mr(/\[/, datetimeR, /\]/);

export const headlineR = {
  priority: /\[#[ABC]\]/,
  todo: /(^TODO\s+|DONE\s+)/,
  tags: /:.+:\s*$/,
  head: /^\*+\s+/
};

export const nodeMetadataR = {
  scheduled: mr(/^\s*SCHEDULED:\s*</, datetimeR, repeaterR, warningPeriodR),
  activeTimestampRange: mrg(activeTimestamp, /\-{2}/, activeTimestamp),
  deadline: mr(/^\s*DEADLINE:\s*</, datetimeR, repeaterR, warningPeriodR),
  inactiveTimestamp: inactiveTimestamp,
  closed: mr(/^\s*CLOSED:\s*\[/, datetimeR),
  activeTimestamp: mrg(/(?:^|[^-])/, activeTimestamp, /(?!--)/),
  drawer: [/^\s*:([a-zA-Z_0-9]+):\s*$/, /\s*:END:/] // if form [start, end]
};

export const drawersContentR = {
  clockStarted: mr(/^\s*CLOCK: /, inactiveTimestamp),
  clockEnded: mr(/^\s*CLOCK: /, inactiveTimestamp, /--/, inactiveTimestamp, /\s*=>\s*/, timeR),
  singleProperty: /^\s*:(.*?):\s*(.*?)\s*$/,
};

export const nodeContentR = {
  todoStateHistory: /^\s*- State\s+"\w+"\s+from\s+"\w+"\s+/,
};

// At moment we will understand logbook and properties drawers
// clock in LOGBOOK drawer
// Clock variants we must at least detect:
// CLOCK: [2011-10-04 Tue 16:08]--[2011-10-04 Tue 16:09] =>  0:01
// CLOCK: [2011-10-04 Tue 16:41]
