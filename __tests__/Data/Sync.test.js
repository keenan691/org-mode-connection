/** @flow */

// * Imports

import R from 'ramda';

import { getChanges, isChangedRemotly } from '../../src/Data/Sync';
import Db from '../../src/Data/Db/Db';
import DbHelper from '../../src/Data/Db/DbHelper';
import FileAccess from '../../src/Helpers/FileAccess';
import Queries from '../../src/Data/Queries';

// * Mocks

jest.mock('../../src/Helpers/FileAccess');

const MOCKED_FILES = {
  'basic' : '* node 1\n',
  'remoteChanges1': '* updated node\nd\n** other\n** other\n',
  'remoteChanges2': '* prepended node\n* updated node\n',
};

// * Functions

const writeToFile = (name) => FileAccess.write(MOCKED_FILES[name]);
const createAndAddFileToCleanDb = (name) => Queries.clearDb().then(
  () => FileAccess.write(MOCKED_FILES[name]).then(
    () => Queries.addFile(name)))

// * Tests lifecycle functions

afterAll(() => {
  Queries.clearDb()
})

// * Tests

describe('isChangedRemotly', () => {

  beforeAll(() => { return createAndAddFileToCleanDb('basic') })

  test('recognizing no external change', () => {
    expect.assertions(1)
    return Queries.getFiles().then(
      files => expect(isChangedRemotly(files[0])).resolves.toBeFalsy())})

  test('recognizing external changes', () => {
    expect.assertions(1)
    return FileAccess.write(MOCKED_FILES['basic']).then(
      () => Queries.getFiles().then(
        files => expect(isChangedRemotly(files[0])).resolves.toBeTruthy()))})})

describe('getChanges', () => {

  beforeEach(() => { return createAndAddFileToCleanDb('remoteChanges1') })

  test('returning remote changes', () => {
    dupaa
    expect.assertions(1)
    return writeToFile('remoteChanges1').then(
      () => Queries.getFiles().then(
        (files) => expect(getChanges(files[0])).resolves.toHaveProperty('remote', 4)))
  })

  // test('returning local changes', () => {

  // })

  // test('', () => {

  // })
})
