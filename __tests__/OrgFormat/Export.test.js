/** @flow */

import R from "ramda";

import {
  createNewNode,
  recreateOriginalNode,
} from '../../src/OrgFormat/Export';
import { getOrgFileContent } from "../../src/Helpers/Fixtures";
import { parse } from '../../src/OrgFormat/Parser';

test.only("full parse-export test", () => {
  const originalContent = getOrgFileContent("parse-export-test.org");
  const parsedNodes = parse(originalContent)
  parsedNodes.forEach(
    node => expect(recreateOriginalNode(node)).toEqual(createNewNode(node)))})
