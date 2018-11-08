import R from 'ramda';

import fs from 'fs';
import path from 'path';

const makeOrgFilePath = name => `fixtures/${name}`;
const getFileDescriptor = path => fs.openSync(path, 'r');
const readData = fd => fs.readFileSync(fd, 'utf8');

export const getOrgFileContent = R.pipe(
  makeOrgFilePath,
  getFileDescriptor,
  readData,
  R.split('\n')
);
