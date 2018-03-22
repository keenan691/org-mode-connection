/** @flow */

import R from "ramda";

import { headlineT } from './Transformations';

const recreateOriginalNode = (node) => R.compose(
  R.concat(headlineT.level.toOrg(node)),
  R.concat(node.rawHeadline),
  R.concat('\n'),
  R.concat(node.rawContent)
);

export const createNewNode = (node) => R.compose(
  R.concat(headlineT.level.toOrg(node)),
  R.concat(headlineT.todo.toOrg(node)),
  R.concat(headlineT.priority.toOrg(node)),
  R.concat(node.headline),
  R.concat(headlineT.tags.toOrg(node)),
  R.concat('\n'),
  R.concat(node.content))('')

const exportNodeToOrgRepr = (node) => node.isAdded || node.isChanged ? createNewNode(node) : recreateOriginalNode(node)

export default exportNodeToOrgRepr
