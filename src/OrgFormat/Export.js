/** @flow */

import R from "ramda";

import { enhanceNode } from '../Data/Queries';
import { headlineT, nodeMetadataT } from './Transformations';

export const recreateOriginalNode = (node) =>
  headlineT.level.toOrg(node) +
  node.rawHeadline + '\n' + node.rawContent

export const createNewNode = (rawNode) => {
  const node = enhanceNode(rawNode);
  return headlineT.level.toOrg(node) +
    headlineT.todo.toOrg(node) +
    headlineT.priority.toOrg(node) +
    node.headline +
    headlineT.tags.toOrg(node) + '\n' +
    [nodeMetadataT.scheduled.toOrg(node.scheduled),
     nodeMetadataT.deadline.toOrg(node.deadline),
     nodeMetadataT.closed.toOrg(node.closed)].join(' ').trim() +
    (node.drawers ? '\n' + Object.keys(node.drawers).map(
      key => `:${key}:\n${ node.drawers[key].length > 0 ? node.drawers[key].join('\n') + '\n' : '' }:END:`).join('\n'): '') +
    node.content }

const exportNodeToOrgRepr = (node) => node.isAdded || node.isChanged ? createNewNode(node) : recreateOriginalNode(node)

export default exportNodeToOrgRepr
