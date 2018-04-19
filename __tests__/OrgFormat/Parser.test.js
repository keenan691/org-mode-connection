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
    rawContent: "\nNunc eleifend leo vitae magna.\n",
    rawHeadline: "node 1",
    level: 1,
    position: 0,
    range: [6, 10]
  },

  {
    content: "\nNunc porta vulputate tellus.\n",
    headline: "node 2",
    rawContent: "\nNunc porta vulputate tellus.\n",
    rawHeadline: "node 2",
    level: 1,
    position: 1,
    range: [10, 14]
  },

  {
    content: "",
    headline: "subnode 2-1",
    rawContent: "",
    rawHeadline: "subnode 2-1",
    level: 2,
    position: 2,
    range: [14, 16] },

  {
    content: "\nDonec posuere augue in quam.\n",
    headline: "subnode 3-1",
    rawContent: "\nDonec posuere augue in quam.\n",
    rawHeadline: "subnode 3-1",
    level: 3,
    position: 3,
    range: [16, 20]
  },

  {
    content: "",
    headline: "subnode 2-2",
    rawContent: "",
    rawHeadline: "subnode 2-2",
    level: 2,
    position: 4,
    range: [20, 22] }
];

// * Tests

test("Parses simple org file", () => {
  const parsingResult = parse(getOrgFileContent("nodes.org"));
  expect(parsingResult.file).toEqual(expectedFileContent)
  expect(parsingResult.nodes).toEqual(expectedNodes);
});
