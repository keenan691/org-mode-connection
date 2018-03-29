// * Imports

import R from "ramda";

import { extractNodesFromLines } from '../OrgFormat/NodesExtractor';
import { headlineT } from '../OrgFormat/Transformations';
import { log, rlog } from '../Helpers/Debug';
import { nullWhenEmpty, promisePipe } from '../Helpers/Functions';
import { parseNode } from '../OrgFormat/Parser';
import Export from '../OrgFormat/Export';
import FileAccess from '../Helpers/FileAccess';
import Queries from './Queries';

// import Queries from './Queries';

// * Sync

// ** How we know that changes occured?

// *** Remote
// Compare file mod time with one saved in db.

// *** Local
// File node has flag isChanged - we don't want to waste time for query every time cron schedule sync.

// ** What happens after sync method is run

// *** No changes
// pass

// *** TODO [3/4] Only local changes occured
// 1. [X] Get all file db nodes
// 2. [X] Divide original file using nodes line ranges eg.
//    [begginning, node1, text, node2, end]
//    begginning and end can be empty
// 3. [X] map nodes to org repr
//    1. [X] if node is changed or added coumpute its org repr
//    2. [X] if node is not changed get org repr from file using old position
// 4. [ ] overwrite file

// *** TODO [0/6] Only external changes occured
// *Directions* :
// - [ ] when it's possible keep ids.
// - [ ] crc is computed ignoring position
// - [ ] id is made from concated crc, indent and position
// - [ ] thing more abouth cases of headlines with same crc but different positions. No matter with one is whith becouse it have the same identity. One important thing is to always taka first when processing to, due to not forget about other. *Do tests for this case*

// *Process* :
// 1. [ ] Phase one - exclude not changed
//    - Extract external nodes with position and compute theirs crc's
//    - Get local nodes
//    - Exclude from both groups nodes with same crcc and update theirs positions and indent if needed

// 2. [ ] Phase two - try to recognize common changes to avoid loss of id
//    - parse rest of nodes
//    - exclude group with new headlines - if there is new headline it means that this node is new
//    - pair nodes with same headlines and seek for common changes
//      - todo state has changed (content will be changed also becouse of todo state history - do something with this: either parse state changes as metadata or remove them before compare) and content can changed rest is the same
//      - only tags has changed
//      - only scheduled or deadline has changed
//      - only priority has changed
//      - only drawers has changed
//    - update those nodes
//    - delete rest of nodes from db
//    - add remaining nodes from file as new

// *** TODO [1/3] Both local and external changes occured
// Try to merge.

// 1. [X] Do the same like in external changes point.
// 2. [ ] If changed nodes is not deleted then update it like in local changes point.
// 3. [ ] If it's not possible return error message with this node id headline and position and mark this file as conflicted.

// Conflited file will not be synced util conflict is resolved. Future possible action will be:
//    - delete those nodes and sync file
//    - force version from db
//    - merge nodes to manual resolve with tag resolve


// * Code

// ** Propagate changes

// *** Helpers

export const getNewExternalMtime =
  file => FileAccess.stat(file.path).then(
    stat => stat.mtime > file.lastSync ? stat.mtime : false)

const realmResultToArray = res => res.slice(0, Infinity);

const getNodesFromDbAsArray = (file) => Queries.getNodes('file = $0', file).then(nodes => realmResultToArray(nodes))

const getRawNodesFromFile = promisePipe(
  R.prop('path'),
  R.curry(FileAccess.read),
  extractNodesFromLines)

const ExternalAndLocalChangesToOneList = promisePipe(
  R.converge((...results) => Promise.all(results), [getNodesFromDbAsArray, getRawNodesFromFile]),
  R.unnest)

const groupBySimilarity = R.pipe(
  R.sortBy(R.prop('rawHeadline')),
  R.groupWith((n1, n2) => n1.rawHeadline == n2.rawHeadline && n1.rawContent == n2.rawContent))

const partitionEachGroupByIdPossesion = R.map(R.partition(
  node => node.id === undefined));

const groupByChangedAndNotChanged = R.groupBy(
  nodesGroup => {
    if (nodesGroup.length === 2 && nodesGroup[0].length === nodesGroup[1].length) {
      return 'notChangedNodes' }
    else if (nodesGroup[1][0] == undefined) {
      return 'addedNodes'
    } else {
      return 'deletedNodes'}});

const getLocallyChangedNodes = file => file.nodes.filtered('isChanged = true')

const partitionToChangedGroupsAndRest = R.partition(
  group => group.length === 2 && group[0].length === group[1].length)

const prepareOutput = R.evolve({
  notChangedNodes: R.map(R.apply(R.zip)),
  addedNodes: R.flatten,
  deletedNodes: R.flatten});

// *** Main

export const getChanges = (file) => {

  const localChanges = nullWhenEmpty(getLocallyChangedNodes(file))
  let externalChanges = new Promise(r => r(null))

  return getNewExternalMtime(file).then(newExternalMtime => {
    if (!newExternalMtime && !localChanges) return null

    if (newExternalMtime) externalChanges = promisePipe(
      ExternalAndLocalChangesToOneList,
      groupBySimilarity,
      partitionEachGroupByIdPossesion,
      groupByChangedAndNotChanged,
      prepareOutput)(file)

    return externalChanges.then(externalChanges => ({
      externalChanges,
      localChanges,
      file}))})};

// ** Sync

// *** Helpers

const applyLocalChanges = (changes) => {
  if (changes.localChanges) {
    const newFileContent = Array.from(changes.file.nodes).map(n => Export(n)).join();
    return FileAccess.write(changes.file.path, newFileContent).then(() => changes)}
  return changes}

const applyExternalChanges = changes => {
  if (changes.externalChanges){
    const externalChanges = changes.externalChanges;
    const deleteNodes = Queries.deleteNodes(externalChanges.deletedNodes);
    const addNodes = Queries.addNodes(externalChanges.addedNodes.map(n => parseNode(n)), changes.file)
    return Promise.all([deleteNodes, addNodes]).then(() => changes)}}

const clearChangedFlags = changes => {};

// *** Main

const syncFile = promisePipe(
  getChanges,
  applyLocalChanges,
  applyExternalChanges, // TODO add remote and local changes
  clearChangedFlags // TODO generate report
)

const syncAllFiles = () => Queries.getFiles().then(files => {
  const syncFilePromises = []
  files.forEach(file => syncFilePromises.push(syncFile(file)))
  return Promise.all(syncFilePromises)})

// * Exports

export default {
  syncDb: () => syncAllFiles()
}
