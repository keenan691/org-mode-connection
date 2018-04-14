// @flow

import R from "ramda";

let FileSystemInterface = null

export const configureFileAccess = (fsInterface) => {
  console.log('conf file access')
  if (!fsInterface) {
    console.log('using default interface')
    // if there is no given fsInterface, use promisified node fsInterface
    // var promisify = require("promisify-node");
    // fsInterface = promisify("fs")
  }

  FileSystemInterface = fsInterface
};

export default {
  stat: (path) => FileSystemInterface.stat(path),
  write (path, content) {},
  read: (path) => FileSystemInterface.readFile(path, 'utf8').then(
    content => content.split('\n'))
}
