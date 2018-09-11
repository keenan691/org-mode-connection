import R from "ramda";

import { getFirstFile, getFirstFileAsPlainObject } from '../funcs';
import { getOrgFileContent } from "../../src/Helpers/Fixtures";
import Db from "../../src/Data/Db/Db";
import DbHelper from "../../src/Data/Db/DbHelper";
import FileAccess from "../../src/Helpers/FileAccess";
import OrgApi from "../../src/OrgApi";
import Queries, {
  addFile,
  addNodes,
  deleteFileById,
  deleteNodeById,
  enhanceNode,
  enhanceNodeWithPosition,
  getObjects,
  getOrCreateNodeByHeadline,
} from '../../src/Data/Queries';

var Realm = require("realm");


// * Prepare

jest.mock("../../src/Helpers/FileAccess");

const loadTestFile = fileName =>
  FileAccess.write("file", getOrgFileContent(fileName).join("\n")).then(() =>
                                                                        OrgApi.importFile(fileName)
                                                                       );

beforeAll(() => {
  OrgApi.configureDb(Realm);
  OrgApi.connectDb();
});

// * Searching tests
// ** Data generators

const blankSearchQuery = {
  todos: {},
  tags: {},
  priority: {
    A: 0,
    B: 0,
    C: 0
  },
  isScheduled: false,
  hasDeadline: false,
  searchTerm: ""
};

const createSearchQuery = obj => R.merge(blankSearchQuery, obj);

// ** Tests

describe("Search", () => {
  beforeAll(() => {
    OrgApi.clearDb();
    return loadTestFile("searching-test.org");
  });

  const searchTest = (testData, expectation) =>
    expect(OrgApi.search(testData)).resolves.toHaveLength(expectation);

  test("Not performing search when passed query is blank", () => {
    return searchTest(blankSearchQuery, 0);
  });

  describe("Scheduled and Deadline", () => {
    test("Searching for scheduled items", () => {
      const searchQuery = createSearchQuery({
        isScheduled: true
      });
      const nodesFound = 3;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching for items with deadline", () => {
      const searchQuery = createSearchQuery({
        hasDeadline: true
      });
      const nodesFound = 2;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching for scheduled items with deadline", () => {
      const searchQuery = createSearchQuery({
        isScheduled: true,
        hasDeadline: true
      });
      const nodesFound = 1;
      return searchTest(searchQuery, nodesFound);
    });
  });

  describe("Priority", () => {
    test("Searching nodes with A priority", () => {
      const searchQuery = createSearchQuery({
        priority: {
          A: 1
        }
      });
      const nodesFound = 2;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching nodes with A and B priority", () => {
      const searchQuery = createSearchQuery({
        priority: {
          A: 1,
          B: 1
        }
      });
      const nodesFound = 3;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching nodes without B priority", () => {
      const searchQuery = createSearchQuery({
        priority: {
          B: -1
        }
      });
      const nodesFound = 4;
      return searchTest(searchQuery, nodesFound);
    });
  });

  describe("Tags", () => {
    test("Searching all drill tags", () => {
      const searchQuery = createSearchQuery({
        tags: {
          drill: 1
        }
      });
      const nodesFound = 3;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching all javascript tags", () => {
      const searchQuery = createSearchQuery({
        tags: {
          javascript: 1
        }
      });
      const nodesFound = 1;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching both javascript and drill tags", () => {
      const searchQuery = createSearchQuery({
        tags: {
          javascript: 1,
          drill: 1
        }
      });
      const nodesFound = 3;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching javascript without drill tags", () => {
      const searchQuery = createSearchQuery({
        tags: {
          javascript: 1,
          drill: -1
        }
      });
      const nodesFound = 0;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching drill and without javascript tags", () => {
      const searchQuery = createSearchQuery({
        tags: {
          javascript: -1,
          drill: 1
        }
      });
      const nodesFound = 2;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching all tagged items without javascript and drill tags", () => {
      const searchQuery = createSearchQuery({
        tags: {
          javascript: -1,
          drill: -1
        }
      });
      const nodesFound = 1;
      return searchTest(searchQuery, nodesFound);
    });
  });

  describe("Todo", () => {
    test("Searching all TODO items", () => {
      const searchQuery = createSearchQuery({
        todos: {
          TODO: 1
        }
      });
      const nodesFound = 3;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching all DONE items", () => {
      const searchQuery = createSearchQuery({
        todos: {
          DONE: 1
        }
      });
      const nodesFound = 2;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching all DONE and TODO items", () => {
      const searchQuery = createSearchQuery({
        todos: {
          DONE: 1,
          TODO: 1
        }
      });
      const nodesFound = 5;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching all tasks with state not equal DONE items", () => {
      const searchQuery = createSearchQuery({
        todos: {
          DONE: -1
        }
      });
      const nodesFound = 3;
      return searchTest(searchQuery, nodesFound);
    });

    test("Using only positive query when given both", () => {
      const searchQuery = createSearchQuery({
        todos: {
          DONE: -1,
          TODO: 1
        }
      });
      const nodesFound = 3;
      return searchTest(searchQuery, nodesFound);
    });
  });

  describe("Mixed filters", () => {
    test("Searching todos with deadline", () => {
      const searchQuery = createSearchQuery({
        todos: {
          TODO: 1
        },
        hasDeadline: true
      });
      const nodesFound = 1;
      return searchTest(searchQuery, nodesFound);
    });

    test("Searching scheduled items tagged with drill", () => {
      const searchQuery = createSearchQuery({
        tags: {
          drill: 1
        },
        isScheduled: true
      });
      const nodesFound = 2;
      return searchTest(searchQuery, nodesFound);
    });
  });
});

// * Helper functions test

describe("Helper functions", () => {
  beforeAll(() => {
    OrgApi.clearDb();
    return loadTestFile("full.org");
  });

  test("getOrCreateNodeByHeadline on non-exisiting path", async () => {
    const files = await Queries.getFiles();
    const [node, created] = await getOrCreateNodeByHeadline(files[0], "node 123334");
    expect(created).toEqual(true)
    expect(node).toHaveProperty("position", 5)
  });

  test("getOrCreateNodeByHeadline on exisiting path", async () => {
    const files = await Queries.getFiles();
    const [node, created] = await getOrCreateNodeByHeadline(files[0], "node 1");
    expect(created).toEqual(false)
    expect(node).toHaveProperty("position", 0)
  });

  test("enhanceNodeWithPosition without headline in target", () => {
    Queries.getFiles()
      .then(R.head)
      .then(file => {
        const expectation = {
          position: file.nodes.length,
          level: 1
        };
        expect(enhanceNodeWithPosition(file)({})).toEqual(expectation);
      });
  });

  // test("enhanceNodeWithPosition with headline in target", () => {
  //   return Queries.getFiles()
  //     .then(R.head)
  //     .then(file => {
  //       const targetNode = file.nodes[0];
  //       const expectation = {
  //         position: (file.nodes[1].position + file.nodes[2].position) / 2,
  //         level: targetNode.level + 1
  //       };
  //       expect(enhanceNodeWithPosition(file, targetNode)({})).toEqual(
  //         expectation
  //       );
  //     });
  // })
  ;
});

// * Queries tests

describe("Queries with empty db", () => {
  beforeEach(() => {
    OrgApi.clearDb();
  });

  // test("addFile", () => {
  //   return expect(addFile('new').then(getFirstFile)).resolves.toEqual(expect.objectContaining({ title: 'new'}));
  // });

})

describe("Queries", () => {
  beforeEach(() => {
    OrgApi.clearDb();
    return loadTestFile("full.org");
  });

  test("deleteFileById : timestamps are deleted", () => {
    return getFirstFile().then(file => {
      return deleteFileById(file.id).then(() => {
        return expect(getObjects('OrgTimestamp')).resolves.toHaveLength(0)
      })
    });
  });

  test("deleteFileById : nodes are deleted", () => {
    return getFirstFile().then(file => {
      return deleteFileById(file.id).then(() => {
        return expect(getObjects('OrgNode')).resolves.toHaveLength(0)
      })
    });
  });

  test("deleteFileById : file is deleted", () => {
    return getFirstFile().then(file => {
      return deleteFileById(file.id).then(() => {
        return expect(getObjects('OrgFile')).resolves.toHaveLength(0)
      })
    });
  });

  test("deleteNodeById : timestamps deleted", () => {
    return getFirstFile().then(file => {
      return expect(
        deleteNodeById(file.nodes[0].id).then(() => getObjects('OrgTimestamp'))
      ).resolves.toHaveLength(4);
    });
  });

  test("deleteNodeById : node deleted", () => {
    return getFirstFile().then(file => {
      return expect(
        deleteNodeById(file.nodes[0].id).then(() => file.nodes)
      ).resolves.toHaveLength(4);
    });
  });

  test("addNodes : add in the middle of file by id", () => {
    const toExpectation = node => [
      node.headline,
      node.position,
      node.level
    ]

    const expectation = [
      ["node 1", 0, 1],
      ["new", 0.5, 2],
      ["node 2", 1, 1],
      ["subnode 2-1", 2, 2],
      ["subnode 3-1", 3, 3],
      ["subnode 2-2", 4, 2]
    ];

    return getFirstFile().then(file => {
      const nodesToAdd = [{ headline: "new" }];
      const target = {
        fileId: file.id,
        nodeId: file.nodes[0].id
      };
      return expect(
        addNodes(nodesToAdd, target)
          .then(() => Array.from(file.nodes.sorted("position")).map(toExpectation))
      ).resolves.toEqual(expectation);
    });
  });

  test("addNodes : add in the middle of file", () => {
    return getFirstFile().then(file => {
      const nodesToAdd = [{ headline: "new" }];
      const target = {
        fileId: file.id,
        headline: file.nodes[0].headline
      };
      const expectation = [
        ["node 1", 0, 1],
        ["new", 0.5, 2],
        ["node 2", 1, 1],
        ["subnode 2-1", 2, 2],
        ["subnode 3-1", 3, 3],
        ["subnode 2-2", 4, 2]
      ];
      return expect(
        addNodes(nodesToAdd, target)
          .then(() => Array.from(file.nodes.sorted("position")).map(node => [
            node.headline,
            node.position,
            node.level
          ]))
      ).resolves.toEqual(expectation);
    });
  });

  test("addNodes : add as child to last node by headline name", () => {
    return getFirstFile().then(file => {
      const nodesToAdd = [{ headline: "new" }];
      const target = {
        fileId: file.id,
        headline: file.nodes[1].headline
      };
      const expectation = [
        expect.objectContaining({
          position: file.nodes.length,
          level: file.nodes[1].level + 1,
          id: expect.any(String)
        })
      ];
      return expect(addNodes(nodesToAdd, target)).resolves.toEqual(expectation);
    });
  });

  test.only("addNodes : to end of file", () => {
    return getFirstFile().then(file => {
      const nodesToAdd = [{ headline: "new" }];
      const target = {
        fileId: file.id
      };
      const expectation = [
        expect.objectContaining({
          position: file.nodes.length,
          id: expect.any(String)
        })
      ];
      return expect(addNodes(nodesToAdd, target)).resolves.toEqual(expectation);
    });
  });

  test("getFileAsPlainObject", () => {
    expect.assertions(1);
    const obj = getFirstFileAsPlainObject()
    const expectation = expect.objectContaining({
      nodesList: expect.any(Array)
    });
    return expect(obj).resolves.toEqual(expectation);
  });

  test("importFile", () => {
    expect.assertions(1);
    return expect(Queries.getFiles()).resolves.toHaveLength(1);
  });

  test("getNodes", () => {
    expect.assertions(6);
    const nodes = Queries.getNodes();
    return nodes.then(results => {
      expect(results).toHaveLength(5);
      expect(results[0].timestamps).toHaveLength(1);
      expect(results[2].timestamps).toHaveLength(2);
      expect(results[0].tags).toHaveLength(2);
      expect(results[1].tags).toHaveLength(0);
      expect(results[2].tags).toHaveLength(2);
    });
  });

  test("getAgenda", () => {
    expect.assertions(1);
    const agenda = Queries.getAgenda(
      new Date(2018, 2, 12),
      new Date(2018, 2, 15)
    );
    return expect(agenda).resolves.toHaveLength(5);
  });

  test("getAgenda", () => {
    expect.assertions(3);
    const agenda = Queries.getAgenda(
      new Date(2018, 2, 12),
      new Date(2018, 2, 15)
    );
    return agenda.then(result => {
      expect(result[0].nodes).toHaveLength(1);
      expect(result[1].nodes).toHaveLength(1);
      expect(result[2].nodes).toHaveLength(1);
    });
  });

  test("getAgenda", () => {
    expect.assertions(1);
    const agenda = Queries.getAgenda(
      new Date(2018, 2, 12),
      new Date(2018, 2, 12)
    );
    return expect(agenda).resolves.toHaveLength(2);
  });

  test("setDeadline to null", () => {
    expect.assertions(1);
    return Queries.getNodes()
      .then(nodes => enhanceNode(nodes[0]))
      .then(node =>
            node
            .setDeadline(null)
            .then(() => expect(node).toHaveProperty("deadline", undefined))
           );
  });

  test("setDeadline", () => {
    expect.assertions(1);
    return Queries.getNodes()
      .then(nodes => enhanceNode(nodes[0]))
      .then(node =>
            node
            .setDeadline({ date: new Date(2000, 1, 1) })
            .then(() =>
                  expect(node).toHaveProperty("deadline.date", new Date(2000, 1, 1))
                 )
           );
  });

  test("schedule", () => {
    expect.assertions(1);
    return Queries.getNodes()
      .then(nodes => enhanceNode(nodes[0]))
      .then(node =>
            node
            .schedule({ date: new Date(2000, 1, 1) })
            .then(() =>
                  expect(node).toHaveProperty("scheduled.date", new Date(2000, 1, 1))
                 )
           );
  });

  // test("isChanged", () => {
  //   expect.assertions(3);
  //   return Queries.getNodes()
  //     .then(nodes => enhanceNode(nodes[1]))
  //     .then(node => {
  //       expect(node).toHaveProperty("isChanged", false);
  //       expect(node).toHaveProperty("file.isChanged", true);
  //       return node;
  //     })
  //     .then(node =>
  //           node
  //           .schedule({ date: new Date(2000, 1, 1) })
  //           .then(() => expect(node).toHaveProperty("isChanged", true))
  //          );
  // });
});
