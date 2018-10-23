// * Playground
// * Imports
import R from "ramda";

import { getOrgFileContent } from '../src/Helpers/Fixtures';
import FileAccess from '../src/Helpers/FileAccess';
import NodeContentParser from
  '../src/OrgFormat/AtomicParsers/NodeContentParser';
import OrgApi from '../src/OrgApi';

var Realm = require('realm')

// * Prepare

jest.mock('../src/Helpers/FileAccess');

const loadTestFile = async (fileName) => FileAccess.
      write('file', getOrgFileContent(fileName).join('\n')).
      then(() => OrgApi.importFile(fileName))

beforeAll(() => {
  OrgApi.configureDb(Realm)
   OrgApi.connectDb()
  return OrgApi.clearDb()

})

// * Sync

test("Import file", async () => {
  await loadTestFile('organizer.org')
  const testFileId = (await OrgApi.getFiles())[0].id
  const file = (await OrgApi.getFiles())[0]
  // console.log(testFileId)
  // setTimeout(() => null, 100)

  const content = await OrgApi.getFileAsPlainObject(testFileId);
  const nodeId = Object.values(content.nodesList)[0].id;
  await OrgApi.updateNodeById(nodeId, { todo: 'DONE'});
  const res = await OrgApi.syncFile(testFileId)

  // console.log(res)
  // console.log(content)
  // console.log(content.nodesList[0].tags)
  // console.log(content.nodesList.map(n=>`${n.position} ${'*'.repeat(n.level)} ${n.headline}`))
  // expect().toBe(expectation)
});

// * Content

test.only("Content", async () => {
  const res = NodeContentParser("You can make words *bold*, /italic/, _underlined_, =verbatim= and ~code~, and if you must, +strike-through+.")
  console.log(res[0].content)
});

// test("perf getFileAsPlainObject", () => {
//   expect.assertions(1)
//   const start = new Date();
//   const obj = getFirstFile().then((res) => {
//     const end = new Date()
//     console.log(end-start)
//     return res
//   });
//   const expectation = expect.objectContaining({
//     nodesList: expect.any(Array),
//   });
//   return expect(obj).resolves.toEqual(expectation)});
