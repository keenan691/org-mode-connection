/** @flow */

// import look from "ramda-debug";
// import "better-log/install";
import R from "ramda";
const util = require('util');

export const log = (name="DEBUG") => (obj) =>
  console.log(name + ":\n", util.inspect(obj, {
    colors: true,
    showProxy: true,
    showHidden: false,
    depth: 2,
    breakLength: 50
  }), '\n');

export const rlog = (name) => R.tap(log(name))
