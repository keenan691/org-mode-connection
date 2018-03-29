/** @flow */

import R from "ramda";

import { headlineT } from './Transformations';

export const recreateOriginalNode = (node) =>
  headlineT.level.toOrg(node) +
  node.rawHeadline +
  '\n' +
  node.rawContent

export const createNewNode = (node) =>
  headlineT.level.toOrg(node) +
  headlineT.todo.toOrg(node) +
  headlineT.priority.toOrg(node) +
  node.headline +
  headlineT.tags.toOrg(node) +
  '\n' +
  node.content

const exportNodeToOrgRepr = (node) => node.isAdded || node.isChanged ? createNewNode(node) : recreateOriginalNode(node)

export default exportNodeToOrgRepr
