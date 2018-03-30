/** @flow */

import R from "ramda";

import { createNewNode } from '../../src/OrgFormat/Export';
import { parse } from '../../src/OrgFormat/Parser';
import { getOrgFileContent } from "../../src/Helpers/Fixtures";

test("createNewNode", () => {
  const rawNode = ["* This is headline :tag1:tag2:",
                   "content"];
  expect(createNewNode(parse(rawNode)[0])).toEqual(rawNode.join('\n'));});


test.only("full parse-export test", () => {
  const parsedNodes = parse(getOrgFileContent("parse-export-test.org"))
  console.log(parsedNodes)
})
