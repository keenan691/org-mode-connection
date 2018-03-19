/** @flow */

import R from "ramda";

const inRange = (val, start, end) => val >= start && val <= end;
const monthIsCorrect = month => inRange(month, 1, 12);
const shouldHaveDaysInMonth = (year, month) =>
  new Date(year, month, 0).getDate();

export const dateIsCorrect = (year: number, month: number, day: number) =>
  monthIsCorrect(month) && inRange(day, 1, shouldHaveDaysInMonth(year, month));

export const timeIsCorrect = (hour, minute) => inRange(hour, 0, 24) && inRange(minute, 0, 59)
