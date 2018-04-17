// @flow

import R from "ramda";

let FileSystemInterface = null

export const configureFileAccess = (fsInterface) => {
  FileSystemInterface = fsInterface
};

export default {
  stat: (path) => FileSystemInterface.stat(path),
  write (path, content) {},
  read: (path) => FileSystemInterface.readFile(path, 'utf8').then(
    content => content.split('\n'))
}
