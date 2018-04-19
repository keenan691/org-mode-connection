import R from "ramda";
import { dateIsCorrect, timeIsCorrect } from './Validators';
import { log } from '../Helpers/Debug';

// * Helper Objects

const asTwoDigit = digit => ('0' + digit).slice(-2);
const printHour = date => {
  const hour = asTwoDigit(date.getHours()) + ':' + asTwoDigit(date.getMinutes())
  return hour !== '00:00' ? ' ' +hour : ''};

const inactivePar = date => `[${ date }]`;
const asOrgDate = date =>
      `${ date.getFullYear() }-${ asTwoDigit(date.getMonth() + 1) }-${ asTwoDigit(date.getDate()) }`+
      ` ${date.toLocaleDateString('en-GB', { weekday: 'short' }).toLowerCase()}` +
      printHour(date)

const dateAsOrgActiveDate = date => `<${ asOrgDate(date) }>`;
const dateAsOrgInactiveDate = date => `[${ asOrgDate(date) }]`;
const timePointerDateToOrg = {scheduled: dateAsOrgActiveDate,
                              deadline: dateAsOrgActiveDate,
                              closed: dateAsOrgInactiveDate};

const timePointer = (type, useWarningPeriod=false) => ({
  toOrg: obj => obj ? `${ obj.type.toUpperCase() }: ${ timePointerDateToOrg[obj.type](obj.date) }` : '',
  fromOrg: (parsedItem, year, month, day, time, timeRangeEnd, repeater, warningPeriod) => {
    let dateArgs = [];
    let datetimeArgs = [];
    let timeArgs = [];
    let timeRangeEndArgs = [];
    let datetimeRangeEndArgs = [];

    // Date check
    if (year && month && day) {
      month -= 1;
      dateArgs = [year, month, day].map(x => parseInt(x))
      datetimeArgs.push(...dateArgs)
      if (!dateIsCorrect(...dateArgs)) {return []}}

    // Time check
    if (time) {
      timeArgs = time.split(':').map(x => parseInt(x))
      if (!timeIsCorrect(...timeArgs)) {return []}
      datetimeArgs.push(...timeArgs)}

    // Time Range check
    if (timeRangeEnd) {
      timeRangeEndArgs = timeRangeEnd.slice(1).split(':').map(x => parseInt(x))
      if (!timeIsCorrect(...timeRangeEndArgs)) {return []}
      datetimeRangeEndArgs.push(...dateArgs)
      datetimeRangeEndArgs.push(...timeRangeEndArgs)}

    // Bulid result object
    let res = {
      date: new Date(...datetimeArgs), type
    }
    if (!R.isEmpty(datetimeRangeEndArgs)) {res = Object.assign(res, { dateRangeEnd: new Date(...datetimeRangeEndArgs)})};

    if (repeater) {res = Object.assign(res, { repeater })}
    if (useWarningPeriod && warningPeriod) {res = Object.assign(res, { warningPeriod })}

    return res}});

// * Node Headline Trasformations

const addSpaceBefore = (val) => val ? ' ' + val : '';
const addSpaceAfter = (val) => val ? val + ' ' : '';
const countHeadlineLength = node =>
      node.level + 1 + node.headline.length +
      (node.todo ? node.todo.length + 1 : 0)

const tagTab = node => ' '.repeat(64 - countHeadlineLength(node));

export const headlineT = {
  tags: {
    toOrg(node) {
      return node.tags.length > 0 ?
        addSpaceBefore(tagTab(node) + ':' +
                       Array.from(node.tags).map(tag => tag.name).join(':')+':') : ''},
    fromOrg(val) {
      return {
        tags: R.pipe(
          R.split(':'),
          R.slice(1, -1),
          R.map(tag => ({
            name: tag.startsWith('@') ? tag.slice(1) : tag,
            isContextTag: tag.startsWith('@') ? true : false })))(val)}}},

  priority: {
    toOrg(node) {return addSpaceBefore(node.priority)},
    fromOrg(val) {return {priority: val[2]}}},

  todo: {
    toOrg(node) {return addSpaceAfter(node.todo)},
    fromOrg(val) {return {todo: val.trim()}}},

  level: {
    toOrg(node) {return addSpaceAfter('*'.repeat(node.level))},
    fromOrg(val) {return {level: val.trim().length}}}};

// * Node Metadata Transforms

export const nodeMetadataT = {
  drawer: {
    fromOrg: (val) => val.slice(1, -1)},

  activeTimestamp: timePointer("active"),
  activeTimestampRange: {
    fromOrg: (...args) => {
      args.shift()
      const firstPart = args.splice(0, args.length/2);
      const secondPart = args;
      const firstPartObj = timePointer('active').fromOrg("",...firstPart);
      const secondPartObj = timePointer('active').fromOrg("",...secondPart);
      return {
        date: firstPartObj.date,
        dateRangeEnd: secondPartObj.date,
        type: "active"}}},

  closed: timePointer("closed"),
  scheduled: timePointer("scheduled"),
  deadline: timePointer("deadline", true)};
