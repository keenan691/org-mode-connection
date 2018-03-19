/** @flow */

import R from "ramda";

export default {
  __mockFile: {
    content: "",
    stat: {
      mtime: undefined
    }
  },

  write (content) {
    return new Promise((resolve, reject) => {
      this.__mockFile.content = content
      this.__mockFile.stat.mtime = new Date()
      return resolve(true)
    })},
  read ()  { return new Promise((resolve, reject) => resolve(this.__mockFile.content.split('\n'))) },
  stat ()  { return new Promise((resolve, reject) => resolve(this.__mockFile.stat)) }}
