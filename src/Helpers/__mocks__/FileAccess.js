/** @flow */

import R from "ramda";

export default (function (){
  let __mockFile = {
    content: "",
    stat: {
      mtime: new Date(),
      ctime: new Date(),
      name: "some name",
      size: 234}}

  return {
    write (path, content) {
      return new Promise((resolve, reject) => {
        if (__mockFile.content != content) {
          __mockFile.content = content
          __mockFile.stat.mtime = new Date()
        }
        return resolve(true)})},

    exists() {
      return true
    },
    read ()  { return new Promise(
      (resolve, reject) => resolve(__mockFile.content.split('\n')))},

    stat ()  { return new Promise(
      (resolve, reject) => resolve(__mockFile.stat))}}})()
