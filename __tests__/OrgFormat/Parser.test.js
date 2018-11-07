/** @flow */

import { parse } from "../../src/OrgFormat/Parser";
import { getOrgFileContent } from "../../src/Helpers/Fixtures";

// * Data

const expectedFileContent = {
  description: '\nFile description.\nIn few lines.\n',
  metadata: {
    CATEGORY: 'Sample Category',
    TITLE: 'Sample Title'
  }
};

const expectedNodes = [
  {
    content: "\nNunc eleifend leo vitae magna.\n",
    headline: "node 1",
    level: 1,
    position: 1,
    drawers: "null",
    priority: null,
    tags: [],
    timestamps: [],
    todo: null
  },

  {
    content: "\nNunc porta vulputate tellus.\n",
    headline: "node 2",
    level: 1,
    position: 2,
    drawers: "null",
    priority: null,
    tags: [],
    timestamps: [],
    todo: null
  },

  {
    content: "",
    headline: "subnode 2-1",
    level: 2,
    position: 3,
    drawers: "null",
    priority: null,
    tags: [],
    timestamps: [],
    todo: null
  },

  {
    content: "\nDonec posuere augue in quam.\n",
    headline: "subnode 3-1",
    level: 3,
    position: 4,
    drawers: "null",
    priority: null,
    tags: [],
    timestamps: [],
    todo: null
  },

  {
    content: "",
    headline: "subnode 2-2",
    level: 2,
    position: 5,
    drawers: "null",
    priority: null,
    tags: [],
    timestamps: [],
    todo: null
  }
];

// * Tests

test("Parses simple org file", () => {
  const parsingResult = parse(getOrgFileContent("nodes.org"));
  expect(parsingResult.file).toEqual(expectedFileContent)
  expect(parsingResult.nodes).toEqual(expectedNodes);
});
