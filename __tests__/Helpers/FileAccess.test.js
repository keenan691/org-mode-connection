/** @flow */

import R from "ramda";

import FileAccess from '../../src/Helpers/FileAccess';

test('File modify time', () => {
  expect.assertions(1)
  return expect(FileAccess.stat('fixtures/hello.org')).resolves.toHaveProperty('mtime')})
