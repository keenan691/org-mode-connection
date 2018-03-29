/** @flow */

// * Imports

import R from 'ramda';

import { getChanges, getNewExternalMtime } from '../../src/Data/Sync';
import Db from '../../src/Data/Db/Db';
import DbHelper from '../../src/Data/Db/DbHelper';
import FileAccess from '../../src/Helpers/FileAccess';
import OrgApi from '../../src/OrgApi';
import Queries from '../../src/Data/Queries';

// * Mocks

jest.mock('../../src/Helpers/FileAccess');

const MOCKED_FILES = {

  basic : `
* node 1\n`,

  externalChanges1: `
* node1
** node2
** node3
* node4`,

  externalChanges2: `
* prepended node
** new other`,

  externalChanges3: `
* node2
** node1
** node4
* node3 `,

};

// * Functions

const writeToFile = (name) => FileAccess.write(name, MOCKED_FILES[name]);
const getFirstNode = () => Queries.getFiles().then(files => Queries.getNodeById(files[0].nodes[0].id));
const createAndAddFileToCleanDb = (name) => Queries.clearDb().then(
  () => FileAccess.write(name, MOCKED_FILES[name]).then(
    () => Queries.addFile(name)))

// * Tests lifecycle functions

afterAll(() => {
  Queries.clearDb()
})

// * TODO [1/3] Tests

// ** Plan

// - [X] getNewExternalMtime
// - [X] getChanges
//   - [X] recognizing local changed
//   - [X] recognizing external changes
//     - [X] returning changedNodes
//     - [X] returning notChangedNodes
//       - [X] recognizing level change
//       - [X] recognizing position change
// - [ ] sync
//   - [ ] local
//   - [ ] external
//   - [ ] both

// ** Code

describe('getNewExternalMtime', () => {

  beforeAll(() => { return createAndAddFileToCleanDb('basic') })

  test('recognizing no external change', () => {
    expect.assertions(1)
    return Queries.getFiles().then(
      files => expect(getNewExternalMtime(files[0])).resolves.toBeFalsy())})

  test('recognizing external changes', () => {
    expect.assertions(1)
    return FileAccess.write(MOCKED_FILES['basic']).then(
      () => Queries.getFiles().then(
        files => expect(getNewExternalMtime(files[0])).resolves.toBeTruthy()))})})

describe('getChanges external', () => {

  beforeEach(() => { return createAndAddFileToCleanDb('externalChanges1') })

  test('all nodes changed', () => {
    expect.assertions(3)
    return writeToFile('externalChanges2').then(
      () => Queries.getFiles().then(
        (files) => getChanges(files[0]).then(
          changes => {
            expect(changes.localChanges).toBeNull()
            expect(changes.externalChanges.notChangedNodes).toBeUndefined()
            expect(changes.externalChanges.addedOrDeletedNodes).toHaveLength(6)})))})

  // test('all nodes reorganized', () => {
  //   expect.assertions(3)
  //   return writeToFile('externalChanges3').then(
  //     () => Queries.getFiles().then(
  //       (files) => getChanges(files[0]).then(
  //         changes => {
  //           expect(changes.localChanges).toBeNull()
  //           expect(changes.externalChanges.notChangedNodes).toHaveLength(4)
  //           expect(changes.externalChanges.addedOrDeletedNodes).toBeUndefined()})))})

  test('returning external changes', () => {
    expect.assertions(1)
    return writeToFile('externalChanges1').then(
      () => Queries.getFiles().then(
        (files) => expect(getChanges(files[0])).resolves.toMatchObject({
          externalChanges: {
            notChangedNodes: expect.anything()},
          localChanges: null,
          file: expect.anything()})))})

  test('returning no local changes', () => {
    expect.assertions(1)
    return writeToFile('externalChanges1').then(
      () => Queries.getFiles().then(
        (files) => expect(getChanges(files[0])).resolves.toHaveProperty('localChanges', null)))})})

describe("sync", () => {
  expect.assertions(1)
  beforeEach(() => { return createAndAddFileToCleanDb('externalChanges1') })
  test('syncing local changes to file', () => {
    expect.assertions(1)
    return getFirstNode().then(
      node => node.setTodo('NEXT')).then(
        () => OrgApi.syncDb()).then(
          () => expect(getFirstNode()).resolves.toHaveProperty('todo', 'NEXT')
        )
  })
})
