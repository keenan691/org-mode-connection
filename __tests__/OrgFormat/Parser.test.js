/** @flow */

import { parse } from "../../src/OrgFormat/Parser";
import { getOrgFileContent } from "../../src/Helpers/Fixtures";

test("Parses simple org file", () => {
  expect(parse(getOrgFileContent("nodes.org"))).toEqual([
    {
      content: "\nNunc eleifend leo vitae magna.\n",
      headline: "node 1",
      rawContent: "\nNunc eleifend leo vitae magna.\n",
      rawHeadline: "node 1",
      level: 1,
      position: 0,
      range: [0, 4]
    },

    {
      content: "\nNunc porta vulputate tellus.\n",
      headline: "node 2",
      rawContent: "\nNunc porta vulputate tellus.\n",
      rawHeadline: "node 2",
      level: 1,
      position: 1,
      range: [4, 8]
    },

    {
      content: "",
      headline: "subnode 2-1",
      rawContent: "",
      rawHeadline: "subnode 2-1",
      level: 2,
      position: 2,
      range: [8, 10] },

    {
      content: "\nDonec posuere augue in quam.\n",
      headline: "subnode 3-1",
      rawContent: "\nDonec posuere augue in quam.\n",
      rawHeadline: "subnode 3-1",
      level: 3,
      position: 3,
      range: [10, 14]
    },

    {
      content: "",
      headline: "subnode 2-2",
      rawContent: "",
      rawHeadline: "subnode 2-2",
      level: 2,
      position: 4,
      range: [14, 16] }
  ]);
});
