/** @flow */

import R from "ramda";

import { getOrgFileContent } from '../src/Helpers/Fixtures';
// import Db from '../src/Data/Db/Db';
// import DbHelper from '../src/Data/Db/DbHelper';
import FileAccess from '../src/Helpers/FileAccess';
import OrgApi from '../src/OrgApi';
// import Queries, { enhanceNode } from '../src/Data/Queries';

var Realm = require('realm')

// * Prepare

jest.mock('../src/Helpers/FileAccess');

const loadTestFile = async (fileName) => FileAccess.
      write('file', getOrgFileContent(fileName).join('\n')).
      then(() => OrgApi.importFile(fileName))

beforeAll(() => {
  OrgApi.configureDb(Realm)
   OrgApi.connectDb()
  // return OrgApi.clearDb()

})


test.only("Import file", async () => {
  await loadTestFile('organizer.org')
  const testFileId = (await OrgApi.getFiles())[0].id
  const file = (await OrgApi.getFiles())[0]
  // console.log(testFileId)
  // setTimeout(() => null, 100)

  const res = await OrgApi.syncFile(testFileId)
  const content = await OrgApi.getFileAsPlainObject(testFileId);
  console.log(res)
  console.log(content)
  console.log(content.nodesList[0].tags)
  // console.log(content.nodesList.map(n=>`${n.position} ${'*'.repeat(n.level)} ${n.headline}`))
  // expect().toBe(expectation)
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
