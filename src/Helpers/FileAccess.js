// @flow

import R from "ramda";
// import fs from "fs";
import path from "path";
var promisify = require("promisify-node");
var fs = promisify("fs");
// * NodeJS file handling



// * React Native file handling
// RNFS.readFile(filepath).then(contents=>)
// const RNFS = require('react-native-fs')
// export function getFilesWithExternalChanges(orgFilesState=temp) {
//   return Promise.all(orgFilesState.map(file => RNFS.exists(file.path)))
//     .then(filesExists => {
//       const existingFiles = orgFilesState.filter((v, i) => filesExists[i]);
//       const deletedFiles = orgFilesState.filter((v, i) => !filesExists[i]);
//       return { deletedFiles, existingFiles };
//     })
//     .then(({ existingFiles, deletedFiles }) => {
//       return Promise.all(existingFiles.map(file => RNFS.stat(file.path)))
//         .then(stats => {
//           const changedFiles = existingFiles.filter((v, i) => v.lastSync <
//                                                     stats[i].mtime);
//           // Flat results
//           return {
//             changed: changedFiles.map(o => o.path),
//             deleted: deletedFiles.map(o => o.path)
//           };
//         });
//     });
// }

// * Facade

export default {
  stat: (path) => fs.stat(path),
  write (path, content) {},
  read: (path) => fs.readFile(path, 'utf8').then(content => content.split('\n'))
};
