/** @flow */

import R from "ramda";

import { exportNodeToOrgRepr } from '../../src/OrgFormat/Export';
import { parse } from '../../src/OrgFormat/Parser';

test("exportNodeToOrgRepr", () => {
  const rawNode = ["* This is headline :tag1:tag2:",
                   "content"];
  expect(exportNodeToOrgRepr(parse(rawNode)[0])).toEqual(rawNode.join('\n'));
});
