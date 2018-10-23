import R from "ramda";

import { enhanceNode } from '../Data/Queries';
import { headlineT, nodeMetadataT } from './Transforms';

export const nodeToOrg = (rawNode) => {
  const node = enhanceNode(rawNode);
  const drawers = JSON.parse(node.drawers);
  const orgDrawers = (drawers!==null ?  Object.keys(drawers).map(
    key => `:${key}:\n${ drawers[key].length > 0 ? drawers[key].join('\n') + '\n' : '' }:END:`).join('\n') + '\n': '')
  const timestamps = [nodeMetadataT.scheduled.toOrg(node.scheduled),
                      nodeMetadataT.deadline.toOrg(node.deadline),
                      nodeMetadataT.closed.toOrg(node.closed)].filter(t => t!=='');

  const content = node.content.trim();
  const res = headlineT.level.toOrg(node) +
    headlineT.todo.toOrg(node) +
    headlineT.priority.toOrg(node) +
    node.headline + headlineT.tags.toOrg(node) + '\n' +
    timestamps.join(' ').trim() + (timestamps.length>0 ? '\n' : '') +
    orgDrawers +
        content + (content.length > 0 ? '\n' : '')
  // console.log(res)
  // console.log(res)
  return res
}


// const exportNodeToOrgRepr = (node) => (node.isAdded || node.isChanged) ? nodeToOrg(node) : recreateOriginalNode(node)

export const fileToOrgRepr = file => {
  const desc = file.description;
  const metadata = R.pipe(R.toPairs, R.map(([key, val]) => `#+${key}: ${val}\n`))(JSON.parse(file.metadata));
  return metadata + desc + '\n'
};

export default nodeToOrg
