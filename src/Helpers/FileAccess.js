// @flow

import R from "ramda";

let FileSystems = {}
let FileSystemsInterfaces = {}

// * NodeJS file handling

try {
  var promisify = require("promisify-node");
  FileSystems['fs'] = promisify("fs")
  console.log('node fs registered')
} catch (error) {
  // console.log(error)
}

// * React Native file handling

try {
  FileSystems['RNFS'] = require("react-native-fs")
  console.log('react native fs registered')
} catch (error) {
  // console.log(error)
}

// * Select default filesystem

const defaultFS = FileSystems.RNFS ? FileSystems.RNFS : FileSystems.fs

// * Api

export default {
  stat: (path) => defaultFS.stat(path),
  write (path, content) {},
  read: (path) => defaultFS.readFile(path, 'utf8').then(
    content => content.split('\n'))
}
