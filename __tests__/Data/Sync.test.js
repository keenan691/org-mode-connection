/** @flow */

import R from "ramda";

import { isChangedRemotly } from '../../src/Data/Sync';
import Db from '../../src/Data/Db/Db';
import DbHelper from '../../src/Data/Db/DbHelper';
import FileAccess from '../../src/Helpers/FileAccess';
import Queries from '../../src/Data/Queries';

jest.mock('../../src/Helpers/FileAccess');

const MOCK_FILE_VERSIONS = {
  'basic' : "* node 1\n",
  'node changed': "* updated node"
};

afterAll(() => {
  DbHelper.init()
  DbHelper.getInstance().then(realm => Db(realm).cleanUpDatabase())
})

beforeAll(() => {
  FileAccess.write(MOCK_FILE_VERSIONS['basic']).then(
    () => Queries.addFile('basic'))
})

test("isChangedRemotly", () => {
  expect.assertions(1)
  return Queries.getFiles().then(
    files => expect(isChangedRemotly(files[0])).resolves.toBeFalsy())})

test("isChangedRemotly", () => {
  expect.assertions(1)
  return FileAccess.write(MOCK_FILE_VERSIONS['basic']).then(
    () => Queries.getFiles().then(
      files => expect(isChangedRemotly(files[0])).resolves.toBeTruthy()))})
