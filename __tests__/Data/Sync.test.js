// * Imports

import R from 'ramda';

import { getChanges, getNewExternalMtime } from '../../src/Data/Sync';
import { getFirstFileAsPlainObject } from '../../testTools';
import { updateNodeById } from '../../src/Data/Queries/UpdateQueries';
import Db, { connectDb } from '../../src/Data/Db/Db';
import DbHelper from '../../src/Data/Db/DbHelper';
import FileAccess from '../../src/Helpers/FileAccess';
import OrgApi from '../../src';
import Queries, { mapNodesToPlainObject } from '../../src/Data/Queries';

var Realm = require('realm');

// * Mocks

jest.mock('../../src/Helpers/FileAccess');

const MOCKED_FILES = {
  empty: `
`,

  basic: `
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

const getFirstFile = () => Queries.getFiles().then(files => files[0]);
const writeToFile = name => FileAccess.write(name, MOCKED_FILES[name]);
const getFirstNode = () =>
  getFirstFileAsPlainObject().then(file => file.nodesList[0]);

const createAndAddFileToCleanDb = name =>
  Queries.clearDb().then(() =>
    FileAccess.write(name, MOCKED_FILES[name]).then(() =>
      OrgApi.importFile(name)
    )
  );

// * Tests lifecycle functions

afterAll(() => {
  Queries.clearDb();
});

beforeAll(() => {
  OrgApi.configureDb(Realm);
  return connectDb();
});

// * Tests

describe('Check nodes integrity after sync', () => {
  beforeEach(() => {
    return createAndAddFileToCleanDb('empty');
  });

  test('syncing changes in file header', () => {
    const expectation = FileAccess.write('empty', '#+TITLE: sdf\ndesc')
      .then(OrgApi.syncDb)
      .then(() => getFirstFile());
    return expect(expectation).resolves.toEqual(
      expect.objectContaining({
        description: 'desc',
        metadata: JSON.stringify({
          TITLE: 'sdf',
        }),
      })
    );
  });

  // test("remove clone of existing node", () => {
  //   const expectation = FileAccess.write('empty', '* node\n* node').
  //         then(OrgApi.syncDb).
  //         then(() => FileAccess.write('empty', '* node')).
  //         then(OrgApi.syncDb).
  //         then(() => OrgApi.getNodes())
  //   return expect(expectation).resolves.toHaveLength(1)});

  // test("adding clone of existing node", () => {
  //   const expectation = FileAccess.write("empty", "* node")
  //     .then(OrgApi.syncDb)
  //     .then(() => FileAccess.write("empty", "* node\n* node"))
  //     .then(OrgApi.syncDb)
  //     .then(() => OrgApi.getNodes());
  //   return expect(expectation).resolves.toHaveLength(2);
  // });

  test('syncing with no changes', () => {
    return expect(OrgApi.syncDb()).resolves.toEqual([{}]);
  });
});

// ** Recognize if file needs sync

describe('getNewExternalMtime', () => {
  beforeAll(() => {
    return createAndAddFileToCleanDb('basic');
  });

  test('recognizing no external change', () => {
    expect.assertions(1);
    return Queries.getFiles().then(files =>
      expect(getNewExternalMtime(files[0])).resolves.toBeFalsy()
    );
  });

  test('recognizing external changes', () => {
    expect.assertions(1);
    return FileAccess.write(MOCKED_FILES['basic']).then(() =>
      Queries.getFiles().then(files =>
        expect(getNewExternalMtime(files[0])).resolves.toBeTruthy()
      )
    );
  });
});

// ** Get external changes

// describe('getChanges external', () => {

//   beforeEach(() => { return createAndAddFileToCleanDb('externalChanges1') })

//   test('all nodes changed', () => {
//     expect.assertions(4)
//     return writeToFile('externalChanges2').then(
//       () => Queries.getFiles().then(
//         (files) => getChanges(files[0]).then(
//           changes => {
//             expect(changes.localChanges).toBeNull()
//             expect(changes.externalChanges.notChangedNodes).toBeUndefined()
//             expect(changes.externalChanges.addedNodes).toHaveLength(2)
//             expect(changes.externalChanges.deletedNodes).toHaveLength(4)})))})

//   test('all nodes reorganized', () => {
//     expect.assertions(3)
//     return writeToFile('externalChanges3').then(
//       () => Queries.getFiles().then(
//         (files) => getChanges(files[0]).then(
//           changes => {
//             expect(changes.localChanges).toBeNull()
//             expect(changes.externalChanges.notChangedNodes).toHaveLength(4)
//             expect(changes.externalChanges.addedNodes).toBeUndefined()})))})

//   test('returning external changes', () => {
//     expect.assertions(1)
//     return writeToFile('externalChanges1').then(
//       () => Queries.getFiles().then(
//         (files) => expect(getChanges(files[0])).resolves.toMatchObject({
//           externalChanges: {
//             notChangedNodes: expect.anything()},
//           localChanges: null,
//           file: expect.anything()})))})

//   test('returning no local changes', () => {
//     expect.assertions(1)
//     return writeToFile('externalChanges1').then(
//       () => Queries.getFiles().then(
//         (files) => expect(getChanges(files[0])).resolves.toHaveProperty('localChanges', null)))})})

// ** Synchronization

describe('sync', () => {
  beforeEach(() => {
    return createAndAddFileToCleanDb('externalChanges1');
  });

  test('syncing local changes to file', () => {
    expect.assertions(1);
    return getFirstNode()
      .then(R.prop('id'))
      .then(id => updateNodeById(id, { todo: 'NEXT' }))
      .then(OrgApi.syncDb)
      .then(() =>
        expect(FileAccess.read('externalChanges1')).resolves.toEqual(
          expect.arrayContaining(['* NEXT node1'])
        )
      );
  });

  test('syncing external changes to db', () => {
    expect.assertions(1);
    return writeToFile('externalChanges4').then(() =>
      OrgApi.syncDb().then(() =>
        OrgApi.getNodes().then(nodes => {
          expect(nodes).toHaveLength(3);
        })
      )
    );
  });

  test('externally repositioned nodes syncing in right order', () => {
    expect.assertions(2);
    return writeToFile('externalChanges4').then(() =>
      OrgApi.syncDb().then(() =>
        getFirstNode().then(node => {
          expect(node).toHaveProperty('headline', 'node2');
          expect(node).toHaveProperty('level', 1);
        })
      )
    );
  });

  test('receiving conflict message', () => {
    expect.assertions(1);
    return getFirstNode()
      .then(node => Queries.updateNodeById(node.id, { todo: 'NEXT' }))
      .then(() => writeToFile('externalChanges4'))
      .then(() =>
        expect(OrgApi.syncDb()).resolves.toEqual([
          {
            externalChanges: {
              addedNodes: 1,
              deletedNodes: 2,
              changedNodes: 2,
            },
            externalFileHeaderChanges: {
              description: '',
              metadata: {},
            },
            localChanges: 1,
          },
        ])
      );
  });

  test('not calling sync when nothing is changed', () => {
    expect.assertions(1);
    return expect(OrgApi.syncDb()).resolves.toEqual([{}]);
  });

  test('local changes sync returning status', () => {
    expect.assertions(1);
    return getFirstNode()
      .then(node => Queries.updateNodeById(node.id, { todo: 'NEXT' }))
      .then(() =>
        expect(OrgApi.syncDb()).resolves.toEqual([
          {
            localChanges: 1,
            externalFileHeaderChanges: null,
            externalChanges: null,
          },
        ])
      );
  });
});

// ** Sync special cases

const createSyncResult = externalChanges => ({
  file: 'empty',
  status: 'success',
  localChanges: null,
  externalFileHeaderChanges: {
    description: '',
    metadata: {},
  },
  externalChanges,
});
