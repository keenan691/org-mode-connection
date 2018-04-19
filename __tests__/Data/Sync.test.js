/** @flow */

// * Imports

import R from 'ramda';
import { getChanges, getNewExternalMtime } from '../../src/Data/Sync';
import Db from '../../src/Data/Db/Db';
import DbHelper from '../../src/Data/Db/DbHelper';
import FileAccess from '../../src/Helpers/FileAccess';
import OrgApi from '../../src/OrgApi';
import Queries from '../../src/Data/Queries';

var Realm = require('realm')

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

  externalChanges4: `
* node2
** node1
** Added node`,

};

// * Functions

const writeToFile = (name) => FileAccess.write(name, MOCKED_FILES[name]);
const getFirstNode = () => Queries.getFiles().then(files => Queries.getNodeById(files[0].nodes.sorted('position')[0].id));
const createAndAddFileToCleanDb = (name) => Queries.clearDb().then(
  () => FileAccess.write(name, MOCKED_FILES[name]).then(
    () => OrgApi.addFile(name)))

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
// - [-] sync
//   - [X] empty
//   - [X] local
//   - [X] external
//     - [X] only reorganized
//     - [X] only added
//     - [X] only deleted
//   - [X] both
//     - [X] conflict

// ** Code

describe('getNewExternalMtime', () => {

  beforeAll(() => {
    OrgApi.configureDb(Realm)
    OrgApi.connectDb()
    return createAndAddFileToCleanDb('basic') })

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
    expect.assertions(4)
    return writeToFile('externalChanges2').then(
      () => Queries.getFiles().then(
        (files) => getChanges(files[0]).then(
          changes => {
            expect(changes.localChanges).toBeNull()
            expect(changes.externalChanges.notChangedNodes).toBeUndefined()
            expect(changes.externalChanges.addedNodes).toHaveLength(2)
            expect(changes.externalChanges.deletedNodes).toHaveLength(4)})))})

  test('all nodes reorganized', () => {
    expect.assertions(3)
    return writeToFile('externalChanges3').then(
      () => Queries.getFiles().then(
        (files) => getChanges(files[0]).then(
          changes => {
            expect(changes.localChanges).toBeNull()
            expect(changes.externalChanges.notChangedNodes).toHaveLength(4)
            expect(changes.externalChanges.addedNodes).toBeUndefined()})))})

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
          () => expect(FileAccess.read('externalChanges1')).resolves.
            toEqual(expect.arrayContaining(["* NEXT node1"])))})

  test('syncing external changes to db', () => {
    expect.assertions(1)
    return writeToFile('externalChanges4').then(
      () => OrgApi.syncDb().then(
        () => OrgApi.getNodes().then(nodes => {
          expect(nodes).toHaveLength(3)})))})

  test('externally repositioned nodes syncing in right order', () => {
    expect.assertions(2)
    return writeToFile('externalChanges4').then(
      () => OrgApi.syncDb().then(
        () => getFirstNode().then(node => {
          expect(node).toHaveProperty('headline', 'node2')
          expect(node).toHaveProperty('level', 1)})))})

  test('receiving conflict message', () => {
    expect.assertions(1)
    return getFirstNode().then(
      node => node.setTodo('NEXT')).then(
        () => writeToFile('externalChanges4')).then(
          () => expect(OrgApi.syncDb()).resolves.toEqual(
            [{ externalChanges: { addedNodes: 1, deletedNodes: 2, notChangedNodes: 2 },
               file: "externalChanges1",
               localChanges: 1,
               status: "conflict"}]))})

  test('not calling sync when nothing is changed', () => {
    expect.assertions(1)
    return expect(OrgApi.syncDb()).resolves.toHaveLength(0)})

  test('local changes sync returning status', () => {
    expect.assertions(1)
    return getFirstNode().then(
      node => node.setTodo('NEXT')).then(
        () => expect(OrgApi.syncDb()).resolves.toEqual([{ file: 'externalChanges1',
                                                         status: 'success',
                                                         localChanges: 1,
                                                         externalChanges: null}]))})

  test('external changes sync returning status', () => {
    expect.assertions(1)
    return expect(writeToFile('externalChanges4').then(() => OrgApi.syncDb())).resolves.toEqual(
      [{ file: 'externalChanges1',
         status: 'success',
         localChanges: null,
         externalChanges: {addedNodes: 1, deletedNodes: 2, notChangedNodes: 2}}])})})
