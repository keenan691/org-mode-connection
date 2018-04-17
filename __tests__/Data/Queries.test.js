/** @flow */

import R from 'ramda';

import { getOrgFileContent } from '../../src/Helpers/Fixtures';
import Db from '../../src/Data/Db/Db';
import DbHelper from '../../src/Data/Db/DbHelper';
import FileAccess from '../../src/Helpers/FileAccess';
import OrgApi from '../../src/OrgApi';
import Queries, { enhanceNode } from '../../src/Data/Queries';
var Realm = require('realm')

jest.mock('../../src/Helpers/FileAccess');

afterAll(() => {
  DbHelper.init()
  DbHelper.getInstance().then(realm => Db(realm).cleanUpDatabase())
})

beforeAll(() => {
  OrgApi.configureDb(Realm)
  OrgApi.connectDb()
  FileAccess.write('file', getOrgFileContent('full.org').join('\n')).then(() => Queries.addFile('fixtures/full.org'))
})

describe("Queries", () => {

  test.only("getFileAsPlainObject", () => {
    expect.assertions(1)
    const obj = Queries.getFileAsPlainObject('fixtures/full.org');
    const expectation = expect.objectContaining({
      nodes: expect.any(Array),
      id: expect.any(String)});
    return expect(obj).resolves.toEqual(expectation)});

  test("getAllFilesAsPlainObject", () => {
    expect.assertions(1)
    const obj = Queries.getAllFilesAsPlainObject('fixtures/full.org');
    const expectation = expect.objectContaining({
      nodes: expect.any(Array),
      id: expect.any(String)});
    return expect(obj).resolves.toEqual(expectation)});

  test("addFile", () => {
    expect.assertions(1);
    return expect(Queries.getFiles()).resolves.toHaveLength(1)});

  test("getNodes", () => {
    expect.assertions(6);
    const nodes = Queries.getNodes();
    return nodes.then(results => {
      expect(results).toHaveLength(5)
      expect(results[0].timestamps).toHaveLength(1)
      expect(results[2].timestamps).toHaveLength(2)
      expect(results[0].tags).toHaveLength(2)
      expect(results[1].tags).toHaveLength(0)
      expect(results[2].tags).toHaveLength(2)
    })});

  test("getAgenda", () => {
    expect.assertions(1);
    const agenda = Queries.getAgenda(new Date(2018, 2, 12), new Date(2018, 2, 15));
    return expect(agenda).resolves.toHaveLength(5);
  });

  test("getAgenda", () => {
    expect.assertions(3);
    const agenda = Queries.getAgenda(new Date(2018, 2, 12), new Date(2018, 2, 15));
    return agenda.then(result => {
      expect(result[0].nodes).toHaveLength(1)
      expect(result[1].nodes).toHaveLength(1)
      expect(result[2].nodes).toHaveLength(1)
    })
  });

  test("getAgenda", () => {
    expect.assertions(1);
    const agenda = Queries.getAgenda(new Date(2018, 2, 12), new Date(2018, 2, 12));
    return expect(agenda).resolves.toHaveLength(2);
  });


  test("search", () => {
    expect.assertions(1)
    return expect(Queries.search("Node")).resolves.toHaveLength(5);
  });

  test("search", () => {
    expect.assertions(1)
    return expect(Queries.search("nunc")).resolves.toHaveLength(2);
  });

  test("getNodeById", () => {
    expect.assertions(3)
    return Queries.getNodes().then(
      res => res[0].id).then(
        id =>  Queries.getNodeById(id)).then(
          node => {
            expect(node).toHaveProperty('parent', null),
            expect(node).toHaveProperty('headline', 'node 1')
            expect(node).toHaveProperty('deadline.date', new Date(2018, 2, 12))
          })});

  test("setDeadline to null", () => {
    expect.assertions(1)
    return Queries.getNodes().then(nodes => enhanceNode(nodes[0])).then(
      node => node.setDeadline(null).then(
        () => expect(node).toHaveProperty('deadline', undefined)))});

  test("setDeadline", () => {
    expect.assertions(1)
    return Queries.getNodes().then(nodes => enhanceNode(nodes[0])).then(
      node => node.setDeadline({ date: new Date(2000, 1, 1)}).then(
        () => expect(node).toHaveProperty('deadline.date', new Date(2000, 1, 1))))});

  test("schedule", () => {
    expect.assertions(1)
    return Queries.getNodes().then(nodes => enhanceNode(nodes[0])).then(
      node => node.schedule({ date: new Date(2000, 1, 1)}).then(
        () => expect(node).toHaveProperty('scheduled.date', new Date(2000, 1, 1))))});

  test("isChanged", () => {
    expect.assertions(3)
    return Queries.getNodes().then(nodes => enhanceNode(nodes[1])).then(
      node => {
        expect(node).toHaveProperty('isChanged', false)
        expect(node).toHaveProperty('file.isChanged', true)
        return node}).then(
          node => node.schedule({ date: new Date(2000, 1, 1)}).then(
            () => expect(node).toHaveProperty('isChanged', true)))  });


})
