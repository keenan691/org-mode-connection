/** @flow */

import R from 'ramda';

import FileAccess, { configureFileAccess } from '../../src/Helpers/FileAccess';

beforeAll(() => {
  var promisify = require('promisify-node');
  const fsInterface = promisify('fs');
  configureFileAccess(fsInterface);
});

test('File modify time', () => {
  expect.assertions(1);
  return expect(FileAccess.stat('fixtures/hello.org')).resolves.toHaveProperty(
    'mtime'
  );
});
