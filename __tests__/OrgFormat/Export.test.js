/** @flow */

import R from "ramda";

import {
  createNewNode,
  recreateOriginalNode,
} from '../../src/OrgFormat/Export';
import { getOrgFileContent } from "../../src/Helpers/Fixtures";
import { parse } from '../../src/OrgFormat/Parser';
import Db from '../../src/Data/Db/Db';
import DbHelper from '../../src/Data/Db/DbHelper';
import FileAccess from '../../src/Helpers/FileAccess';
import Queries, { enhanceNode } from '../../src/Data/Queries';

jest.mock('../../src/Helpers/FileAccess');

afterAll(() => {
  DbHelper.init()
  DbHelper.getInstance().then(realm => Db(realm).cleanUpDatabase())})

beforeAll(() => {
  FileAccess.write('file',getOrgFileContent('parse-export-test.org').join('\n')).then(() => Queries.addFile('fixtures/full.org'))})

test.only("full parse-export test", () => {
  expect.assertions(5)
  return Queries.getNodes().then(nodes => {
    console.log(nodes)
    nodes.forEach(node => expect(recreateOriginalNode(node)).toEqual(createNewNode(node)))})})
