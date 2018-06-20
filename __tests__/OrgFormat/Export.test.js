/** @flow */

import R from "ramda";

import {
  createNewNode,
  recreateOriginalNode,
} from '../../src/OrgFormat/Export';
import { getOrgFileContent } from "../../src/Helpers/Fixtures";
import Db from '../../src/Data/Db/Db';
import DbHelper from '../../src/Data/Db/DbHelper';
import FileAccess from '../../src/Helpers/FileAccess';
import OrgApi from '../../src/OrgApi';
import Queries, { enhanceNode } from '../../src/Data/Queries';

var Realm = require('realm')

jest.mock('../../src/Helpers/FileAccess');

afterAll(() => {
  DbHelper.init()
  DbHelper.getInstance().then(realm => Db(realm).cleanUpDatabase())})

beforeAll(() => {
  OrgApi.configureDb(Realm)
  OrgApi.connectDb()
  FileAccess.write('file', getOrgFileContent('parse-export-test.org').join('\n')).then(() => OrgApi.importFile('fixtures/full.org'))})

// test("full parse-export test", () => {
//   expect.assertions(5)
//   return Queries.getNodes().then(nodes => {
//     nodes.forEach(node => expect(recreateOriginalNode(node)).toEqual(createNewNode(node)))})})
