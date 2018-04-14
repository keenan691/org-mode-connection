/** @flow */

import R from "ramda";

import FileAccess, { configureFileAccess } from '../../src/Helpers/FileAccess';

beforeAll(() => {
  configureFileAccess()
})

test('File modify time', () => {
  expect.assertions(1)
  return expect(FileAccess.stat('fixtures/hello.org')).resolves.toHaveProperty('mtime')})
