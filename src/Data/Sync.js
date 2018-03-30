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

// * Plan

// ** How we know that changes occured?

// *** Remote
// Compare file mod time with one saved in db.

// *** Local
// File node has flag isChanged - we don't want to waste time for query every time cron schedule sync.

// ** What happens after sync method is run

// *** No changes
// pass

// *** DONE [4/4] Only local changes occured
// CLOSED: [2018-03-29 czw 12:25]
// 1. [X] Get all file db nodes
// 2. [X] Divide original file using nodes line ranges eg.
//    [begginning, node1, text, node2, end]
//    begginning and end can be empty
// 3. [X] map nodes to org repr
//    1. [X] if node is changed or added coumpute its org repr
//    2. [X] if node is not changed get org repr from file using old position
// 4. [X] overwrite file

// *** TODO [5/6] Only external changes occured
// - [X] when it's possible keep ids.

// - [X] Phase one - exclude nodes with changed position
//   - Get local nodes
//   - Exclude from both groups nodes with same headline and content and update theirs positions and indent if needed

// - [X] Phase two - try to recognize common changes to avoid loss of id
// - [ ] Phase three -  recognize common changes of properties to avoid id loss
//   - parse rest of nodes
//   - exclude group with new headlines - if there is new headline it means that this node is new
//   - pair nodes with same headlines and seek for common changes
//     - todo state has changed (content will be changed also becouse of todo state history - do something with this: either parse state changes as metadata or remove them before compare) and content can changed rest is the same
//     - only tags has changed
//     - only scheduled or deadline has changed
//     - only priority has changed
//     - only drawers has changed
//   - update those nodes
// - [X] delete rest of nodes from db
// - [X] add remaining nodes from file as new

// *** TODO [1/3] Both local and external changes occured
// Try to merge.

// 1. [X] Process external changes.
// 2. [ ] If changed nodes is not deleted then update it like in local changes point.
// 3. [ ] If it's not possible return error message with this node id headline and position and mark this file as conflicted.

// Conflited file will not be synced util conflict is resolved. Future possible actions will be:
//    - delete those nodes and sync file
//    - force version from db
//    - merge nodes to manual resolve with tag resolve

// * Code

// ** Propagate changes

export const getNewExternalMtime =
  file => FileAccess.stat(file.path).then(
    stat => stat.mtime > file.lastSync ? stat.mtime : false)

const realmResultToArray = res => res.slice(0, Infinity);

const getNodesFromDbAsArray = file => Queries.getNodes('file = $0', file).then(
  nodes => realmResultToArray(nodes))

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
  notChangedNodes: R.map(R.pipe(R.apply(R.zip), R.map(group => [group[1], group[0]]), R.unnest)),
  addedNodes: R.flatten,
  deletedNodes: R.flatten});

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

// ** Apply changes

const applyLocalChanges = changes => {
  const newFileContent = Array.from(changes.file.nodes).map(n => Export(n)).join();
  return FileAccess.write(changes.file.path, newFileContent).then(() => ({ status: 'success' }))}

const applyExternalChanges = changes => {
  const externalChanges = changes.externalChanges;
  const nodesToAdd = externalChanges.addedNodes.map(n => parseNode(n));
  const deleteNodes = Queries.deleteNodes(externalChanges.deletedNodes);
  const addNodes = Queries.addNodes(nodesToAdd, changes.file)
  const updateNodes = Queries.updateNodes(externalChanges.notChangedNodes, { isChanged: false })
  return Promise.all([deleteNodes, addNodes, updateNodes]).then(() => ({ status: 'success' }))}

const mergeChanges = changes => {
  // At the moment only notify aboout conflict
  // In future we can try to resolve it
  return new Promise(r => r({ status: 'conflict' }))};

// ** Sync

const noChangesP = changes => changes === null
const onlyLocalChangesP = changes => changes.localChanges && !changes.externalChanges;
const onlyExternalChangesP = changes => !changes.localChanges && changes.externalChanges;
const bothExternalAndLocalChangesP = changes => changes.localChanges && changes.externalChanges;

const generateReportAndUpdateFileStatus = changes => syncResult => syncResult.then(
  result => {
    if (result) {
      if (result.status === 'success') Queries.flagFileAsSynced(changes.file)

      const changesSummary = {
        file: R.prop('path'),
        localChanges: R.unless(R.isNil, R.length),
        externalChanges: R.unless(R.isNil, R.pipe(R.evolve({
          addedNodes: R.length,
          deletedNodes: R.length,
          notChangedNodes: R.length})))};

      return Object.assign(result, R.evolve(changesSummary, changes))}

    return new Promise(r => r(null))});

const syncFile = file => getChanges(file).then(changes => R.pipe(
  R.cond([
    [noChangesP, () => new Promise(r => r(null))],
    [onlyLocalChangesP, applyLocalChanges],
    [onlyExternalChangesP, applyExternalChanges],
    [bothExternalAndLocalChangesP, mergeChanges]]),
  generateReportAndUpdateFileStatus(changes),
)(changes))

const syncAllFiles = () => Queries.getFiles().then(
  files => Promise.all(files.map(file => syncFile(file)))).then(res => res.filter(i => i !== null))

// * Exports

export default {
  syncDb: () => syncAllFiles()}