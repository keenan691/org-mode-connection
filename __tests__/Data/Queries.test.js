/** @flow */

import R from 'ramda';

import { getOrgFileContent } from '../../src/Helpers/Fixtures';
import Db from '../../src/Data/Db/Db';
import DbHelper from '../../src/Data/Db/DbHelper';
import FileAccess from '../../src/Helpers/FileAccess';
import OrgApi from '../../src/OrgApi';
import Queries, { enhanceNode } from '../../src/Data/Queries';
var Realm = require('realm')

// * Prepare

jest.mock('../../src/Helpers/FileAccess');

const loadTestFile = (fileName) => FileAccess.
      write('file', getOrgFileContent(fileName).join('\n')).
      then(() => OrgApi.addFile(fileName))

beforeAll(() => {
  OrgApi.configureDb(Realm)
  OrgApi.connectDb()
})

// * Searching tests
// ** Data generators

const blankSearchQuery = {
  todos: {},
  tags: {},
  priority: {
    'A': 0,
    'B': 0,
    'C': 0
  },
  isScheduled: false,
  hasDeadline: false,
  searchTerm: ''
};

const createSearchQuery = (obj) => R.merge(blankSearchQuery, obj);

// ** Tests

describe("Search", () => {
  beforeAll(() => {
    OrgApi.clearDb()
    return loadTestFile('searching-test.org')})

  const searchTest = (testData, expectation) => expect(OrgApi.search(testData)).resolves.
        toHaveLength(expectation)

  test.only("Not performing search when passed query is blank", () => {
    return searchTest(blankSearchQuery, 0)});

  describe("Priority", () => {

    test.only("Searching nodes with A priority", () => {
      const searchQuery = createSearchQuery({
        priority: {
          A: 1
        }})
      const nodesFound = 2
      return searchTest(searchQuery, nodesFound)})

    test.only("Searching nodes with A and B priority", () => {
      const searchQuery = createSearchQuery({
        priority: {
          A: 1,
          B: 1
        }})
      const nodesFound = 3
      return searchTest(searchQuery, nodesFound)})

    test.only("Searching nodes without B priority", () => {
      const searchQuery = createSearchQuery({
        priority: {
          B: -1
        }})
      const nodesFound = 4
      return searchTest(searchQuery, nodesFound)})

  })

  describe("Tags", () => {

    test.only("Searching all drill tags", () => {
      const searchQuery = createSearchQuery({
        tags: {
          drill: 1
        }})
      const nodesFound = 3
      return searchTest(searchQuery, nodesFound)})

    test.only("Searching all javascript tags", () => {
      const searchQuery = createSearchQuery({
        tags: {
          javascript: 1
        }})
      const nodesFound = 1
      return searchTest(searchQuery, nodesFound)})

    test.only("Searching both javascript and drill tags", () => {
      const searchQuery = createSearchQuery({
        tags: {
          javascript: 1,
          drill: 1
        }})
      const nodesFound = 3
      return searchTest(searchQuery, nodesFound)})

    test.only("Searching javascript without drill tags", () => {
      const searchQuery = createSearchQuery({
        tags: {
          javascript: 1,
          drill: -1
        }})
      const nodesFound = 0
      return searchTest(searchQuery, nodesFound)})

    test.only("Searching drill and without javascript tags", () => {
      const searchQuery = createSearchQuery({
        tags: {
          javascript: -1,
          drill: 1
        }})
      const nodesFound = 2
      return searchTest(searchQuery, nodesFound)})

    test.only("Searching all tagged items without javascript and drill tags", () => {
      const searchQuery = createSearchQuery({
        tags: {
          javascript: -1,
          drill: -1
        }})
      const nodesFound = 1
      return searchTest(searchQuery, nodesFound)})

  })

  describe("Todo", () => {
    test.only("Searching all TODO items", () => {
      const searchQuery = createSearchQuery({
        todos: {
          TODO: 1
        }})
      const nodesFound = 3
      return searchTest(searchQuery, nodesFound)})

    test.only("Searching all DONE items", () => {
      const searchQuery = createSearchQuery({
        todos: {
          DONE: 1
        }})
      const nodesFound = 2
      return searchTest(searchQuery, nodesFound)})

    test.only("Searching all DONE and TODO items", () => {
      const searchQuery = createSearchQuery({
        todos: {
          DONE: 1,
          TODO: 1
        }})
      const nodesFound = 5
      return searchTest(searchQuery, nodesFound)})

    test.only("Searching all tasks with state not equal DONE items", () => {
      const searchQuery = createSearchQuery({
        todos: {
          DONE: -1,
        }})
      const nodesFound = 3
      return searchTest(searchQuery, nodesFound)})

    test.only("Using only positive query when given both", () => {
      const searchQuery = createSearchQuery({
        todos: {
          DONE: -1,
          TODO: 1,
        }})
      const nodesFound = 3
      return searchTest(searchQuery, nodesFound)})})

})

// * Queries tests

describe("Queries", () => {
  beforeAll(() => {
    OrgApi.clearDb()
    return loadTestFile('full.org')})

  test("getFileAsPlainObject", () => {
    expect.assertions(1)
    const obj = Queries.getFileAsPlainObject('fixtures/full.org');
    const expectation = expect.objectContaining({
      nodes: expect.any(Array),
// name: expect.any(String),
      // metadata: {
      //   CATEGORY: 'category',
      //   TITLE: 'title'
      // },
      // description: '\ndescription\n',
      // size: expect.any(String),
      // mtime: expect.any(Date),
      // ctime: expect.any(Date),
      // id: expect.any(String)
    });
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
      expect(results[2].tags).toHaveLength(2)})});

  test("getAgenda", () => {
    expect.assertions(1);
    const agenda = Queries.getAgenda(new Date(2018, 2, 12), new Date(2018, 2, 15));
    return expect(agenda).resolves.toHaveLength(5);});

  test("getAgenda", () => {
    expect.assertions(3);
    const agenda = Queries.getAgenda(new Date(2018, 2, 12), new Date(2018, 2, 15));
    return agenda.then(result => {
      expect(result[0].nodes).toHaveLength(1)
      expect(result[1].nodes).toHaveLength(1)
      expect(result[2].nodes).toHaveLength(1)})});

  test("getAgenda", () => {
    expect.assertions(1);
    const agenda = Queries.getAgenda(new Date(2018, 2, 12), new Date(2018, 2, 12));
    return expect(agenda).resolves.toHaveLength(2);});

  test("getNodeById", () => {
    expect.assertions(3)
    return Queries.getNodes().then(
      res => res[0].id).then(
        id =>  Queries.getNodeById(id)).then(
          node => {
            expect(node).toHaveProperty('parent', null),
            expect(node).toHaveProperty('headline', 'node 1')
            expect(node).toHaveProperty('deadline.date', new Date(2018, 2, 12))})});

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
            () => expect(node).toHaveProperty('isChanged', true)))})})
