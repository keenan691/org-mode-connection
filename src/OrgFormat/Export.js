import R from "ramda";

import { enhanceNode } from '../Data/Queries';
import { headlineT, nodeMetadataT } from './Transforms';

export const recreateOriginalNode = (node) =>
  headlineT.level.toOrg(node) +
  node.rawHeadline + '\n' + node.content

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
    // '\n' +
    node.content  }


// const exportNodeToOrgRepr = (node) => (node.isAdded || node.isChanged) ? createNewNode(node) : recreateOriginalNode(node)
const exportNodeToOrgRepr = (node) =>  createNewNode(node)

export const fileToOrgRepr = file => {
  const desc = file.description;
  const metadata = R.pipe(R.toPairs, R.map(([key, val]) => `#+${key}: ${val}\n`))(JSON.parse(file.metadata));
  return metadata + desc + '\n'
};

export default exportNodeToOrgRepr
