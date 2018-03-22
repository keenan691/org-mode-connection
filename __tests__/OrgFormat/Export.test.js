/** @flow */

import R from "ramda";

import { createNewNode } from '../../src/OrgFormat/Export';
import { parse } from '../../src/OrgFormat/Parser';

test("createNewNode", () => {
  const rawNode = ["* This is headline :tag1:tag2:",
                   "content"];
  expect(createNewNode(parse(rawNode)[0])).toEqual(rawNode.join('\n'));
});
