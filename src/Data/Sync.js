// * Imports

import R from "ramda";

import {
  extractNodesFromLines,
  extractPreNodeContentFromLines,
} from '../OrgFormat/NodesExtractor';
import { headlineT } from '../OrgFormat/Transforms';
import { imap, nullWhenEmpty, promisePipe } from '../Helpers/Functions';
import { log, rlog } from '../Helpers/Debug';
import {
  parse,
  parseFileContent,
  parseNode,
  parseNodes
} from '../OrgFormat/Parser';
import { prepareNodes, uniqueId } from './Transforms';
import Export, { fileToOrgRepr } from '../OrgFormat/Export';
import FileAccess from '../Helpers/FileAccess';
import Queries from './Queries';

// * Add file

const importFile = (filepath, type='agenda') => {
  const getFileContent = FileAccess.read(filepath);
  const getFileStats = FileAccess.stat(filepath);
  const transform = ([fileStat, fileContent]) => [fileStat, parse(fileContent)];
  const addToDb = ([fileStat, parsedObj]) => Queries.connectDb().then(realm => realm.write(() => {

    // Create OrgFile object
    const orgFile = realm.create('OrgFile', {
      id: uniqueId(),
      path: filepath,
      lastSync: new Date(),
      description: parsedObj.file.description,
      metadata: JSON.stringify(parsedObj.file.metadata),
      size: fileStat.size,
      mtime: fileStat.mtime,
      ctime: fileStat.ctime,
      type})

    // Creating node objects
    prepareNodes(parsedObj.nodes, orgFile).forEach(node => {
      const orgNode = realm.create('OrgNode', node, true)})}));

  return Promise.all([getFileStats, getFileContent]).then(transform).then(addToDb)
}

const createFileFromString = (name, lines, type='agenda') => {
  const parsedObj = parse(lines);
  // console.tron.log(parsedObj)
  return Queries.connectDb().then(realm => realm.write(() => {
    // Create OrgFile object
    const orgFile = realm.create('OrgFile', {
      id: uniqueId(),
      lastSync: new Date(),
      description: parsedObj.file.description,
      metadata: JSON.stringify({ TITLE: 'readme.org'}),
    })

    // Creating node objects
    prepareNodes(parsedObj.nodes, orgFile).forEach(node => {
      const orgNode = realm.create('OrgNode', node, true)})
  }));
}

// * Description

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

// * Sync

// ** Propagate changes

export const getNewExternalMtime =
  file => FileAccess.stat(file.path).then(
    stat => {
      // console.log(stat.mtime)
      // console.log(file.mtime)
      return stat.mtime > file.mtime ? stat.mtime : false})

const realmResultToArray = res => res.slice(0, Infinity);

const getNodesFromDbAsArray = file => Queries.getNodes('file = $0', file).then(
  nodes => realmResultToArray(nodes))

const getParsedNodesFromFile = promisePipe(
  R.prop('path'),
  R.curry(FileAccess.read),
  parseNodes)

const getFileHeaderFromFile = promisePipe(
  R.prop('path'),
  R.curry(FileAccess.read),
  parseFileContent)

const externalAndLocalChangesToOneList = promisePipe(
  R.converge((...results) => Promise.all(results), [getNodesFromDbAsArray, getParsedNodesFromFile]),
  R.unnest)

const areNodesSimiliar = (n1, n2) => n1.headline == n2.headline && n1.content == n2.content;

const partitionEachGroupByIdPossession = R.map(R.partition(
  node => node.id === undefined));

const groupByChangedAndNotChanged = R.groupBy(
  nodesGroup => {
    if (nodesGroup[0].length === nodesGroup[1].length) {
      return 'changedNodes' }
    else if (nodesGroup[1][0] == undefined) {
      return 'addedNodes'
    } else if (nodesGroup[0][0] === undefined){
      return 'deletedNodes'}
    else if (nodesGroup[0].length != nodesGroup[1].length) {
      return 'notSymetricalGroups' }});

const spreadNotSymmetricalGroups = (groupedNodes) => {
  const { notSymetricalGroups } = groupedNodes;
  if (notSymetricalGroups) {
    notSymetricalGroups.forEach(group => {
      const [newNodes, existingNodes] = group;
      for (let i = 0; i < Math.max(newNodes.length, existingNodes.length); i++) {

        if (newNodes[i] && existingNodes[i]) {
          if (!groupedNodes.changedNodes) groupedNodes.changedNodes = []
          groupedNodes.changedNodes.push([[newNodes[i]], [existingNodes[i]]])}

        else if (newNodes[i]) {
          if (!groupedNodes.addedNodes) groupedNodes.addedNodes = []
          groupedNodes.addedNodes.push([[newNodes[i]]])}

        else if (existingNodes[i]) {
          if (!groupedNodes.deletedNodes) groupedNodes.deletedNodes = []
          groupedNodes.deletedNodes.push([[existingNodes[i]]])}}})}

  return groupedNodes};

const getLocallyChangedNodes = file => file.nodes.filtered('isChanged = true')
const getLocallyAddedNodes = file => file.nodes.filtered('isAdded = true')

const partitionToChangedGroupsAndRest = R.partition(
  group => group.length === 2 && group[0].length === group[1].length)

const rejectNotChangedNodes = (changes) => {
  const fileNodes = changes.fileNodes
  if (fileNodes.length === 0) return changes

  const eqPosition = (savedObj, newProps) => fileNodes[newProps.position-1].id === savedObj.id;
  const eqTags = (savedObj, newProps) => R.equals(Array.from(savedObj.tags).map(R.prop('name')), newProps.tags.map(R.prop('name')));

  const eqTimestamps = (savedObj, newProps) => {
    if (savedObj.timestamps.length !== newProps.timestamps.length) return false

    if (savedObj.drawers!== newProps.drawers) {
      // console.log(typeof newProps.drawers)
      // console.log(typeof savedObj.drawers)
    }
    for (var i = 0; i < newProps.timestamps.length; i++) {
      const ts1 = savedObj.timestamps[i];
      const ts2 = newProps.timestamps[i];
      const tsHasChanged = !R.allPass([
          R.eqProps('date'),
          R.eqProps('dateWithTime'),
          R.eqProps('type'),
          R.eqProps('dateRangeEnd'),
          R.eqProps('dateRangeEndWithTime'),
          R.eqProps('repeater'),
          R.eqProps('warningPeriod'),
        ]

      )(ts1, ts2)

      if (tsHasChanged) return false
    }
    return true
  }

  return R.over(R.lensPath(['externalChanges', 'changedNodes']), R.pipe(
    R.reject(([savedObj, newProps]) => R.allPass([
      R.eqProps('todo'),
      R.eqProps('level'),
      eqPosition,
      eqTimestamps,
      eqTags,
      R.eqProps('priority'),
      R.eqProps('drawers'),
    ])(savedObj, newProps)),
  ), changes)
};


const addNewNodePositions = (changes) => {
  let positions = changes.positions;
  let p1, p2

  const toBatch = R.groupWith((a, b)=> b.position-1===a.position)

  const up = (p1, p2, nodes) => {
    const delta = (p2-p1) / (nodes.length + 1)
    for (var i = 0; i < nodes.length; i++) {
      positions.splice(nodes[i].position-1, 0, p1 + delta + i*delta)
    }
  };

  const updatePosition = nodes => {
    // Pierwszy nod jest traktowany jako główny
    // Następniki
    let position
    let node = nodes[0]
    // console.log(positions.length)
    // console.log(node.position)
    switch (node.position) {

    case 1:
      p1 = 0
      p2 = positions[0]
      up(p1, p2, nodes)
      break;

    case positions.length+1:
      p1 = positions[positions.length-1]
      p2 = p1 + nodes.length+1
      up(p1, p2, nodes)
      break

    default:
      p1 = positions[node.position -2]
      p2 = positions[node.position-1]
      up(p1, p2, nodes)

    }

    return {
      ...node,
      position
    }
  }

  R.pipe(
    toBatch,
    R.map(updatePosition)
  )(changes.externalChanges.addedNodes)

  return changes
};


export const getChanges = (file) => {
  const localChanges = nullWhenEmpty(getLocallyChangedNodes(file))
  let externalChanges = new Promise(r => r(null))
  let externalFileHeaderChanges = new Promise(r => r(null))
  const fileNodes = file.nodes.sorted('position');
  const positions = []
  return getNewExternalMtime(file).then(newExternalMtime => {
    // if (!newExternalMtime && !file.isChanged) return changes

    if (newExternalMtime) {
      externalChanges = promisePipe(
        externalAndLocalChangesToOneList,
        R.sortBy(o => o.headline + o.position + o.level),
        R.groupWith(areNodesSimiliar),
        partitionEachGroupByIdPossession,
        groupByChangedAndNotChanged,
        spreadNotSymmetricalGroups,
        // R.tap(o => console.log(o.changedNodes)),
        R.evolve({
          addedNodes: R.pipe(
            R.flatten,
            R.sortBy(R.prop('position')),
            // R.tap(console.log),
          ),
          deletedNodes: R.flatten,
          changedNodes: R.pipe(
            R.map(R.transpose),
            R.unnest,
            R.map(R.reverse),
          )
        }),
        // R.tap(console.log),
      )(file)

      externalFileHeaderChanges = getFileHeaderFromFile(file)

    }

    return Promise.all([externalChanges, externalFileHeaderChanges]).then(
      ([externalChanges, externalFileHeaderChanges]) => ({
        externalChanges,
        externalFileHeaderChanges,
        localChanges,
        fileNodes,
        file}))})};

// ** Apply changes

const applyFileHeaderExternalChanges = (changes) => {
  if (!changes) return changes
  const fileChanges = changes.externalFileHeaderChanges;
  if (fileChanges) Queries.updateFile(changes.file.id, fileChanges)
  return changes
};

const applyLocalChanges = changes => {
  const nodes = Array.from(changes.file.nodes.sorted('position')).map(n => Export(n)).join('\n');
  const header = fileToOrgRepr(changes.file);
  return FileAccess.write(changes.file.path, header + nodes).then(() => ({ status: 'success' }))}

const applyExternalChanges = type => async changes => {
  let preparedNodes
  const externalChanges = changes.externalChanges;
  const externalFileHeaderChanges = changes.externalFileHeaderChanges;

  const updateNodePos = (node) => ({
    ...node,
    position: changes.positions[node.position-1]
  })

  if (type==='delete' && externalChanges.deletedNodes) {
    await Queries.deleteNodes(externalChanges.deletedNodes)
  } else

  if (type==='add' && externalChanges.addedNodes) {
    // If file is not empty
    if (changes.fileNodes.length > 0) {
      changes = addNewNodePositions(changes)
      preparedNodes = externalChanges.addedNodes.map(
        updateNodePos)
    } else {
      preparedNodes = externalChanges.addedNodes
    }
    // console.log(changes.fileNodes.length)
    // console.log(preparedNodes)
    await Queries.addNodes(preparedNodes, { fileId: changes.file.id }, true, false)

  } else

  if (type==='update' && externalChanges.changedNodes) {
    preparedNodes = externalChanges.changedNodes.map(
      R.over(R.lensIndex(1), updateNodePos)
    )
    // console.log(preparedNodes)
    await Queries.updateNodes(preparedNodes, { isChanged: false })
  }

  return changes
}

const mergeChanges = changes => {
  // At the moment only notify aboout conflict
  // In future we can try to resolve it
  return new Promise(r => r({ status: 'conflict' }))};

// ** Sync

const noChangesP = changes => changes === null
// const onlyLocalChangesP = changes => changes.localChanges && !changes.externalChanges;
const onlyLocalChangesP = changes => changes.file.isChanged
const onlyExternalChangesP = changes => !changes.localChanges && changes.externalChanges;
// const bothExternalAndLocalChangesP = changes => changes.localChanges && changes.externalChanges;
const bothExternalAndLocalChangesP = changes => changes.file.isChanged && changes.externalChanges;

const generateReportAndUpdateStatus = changes  => {
  if (changes.externalChanges===null && changes.localChanges===null) return null

  const changesToSummary = {
    file: R.prop('path'),
    localChanges: R.unless(R.isNil, R.length),
    externalChanges: R.unless(R.isNil, R.pipe(R.evolve({
      addedNodes: R.length,
      deletedNodes: R.length,
      changedNodes: R.length})))};

  if (changes.localChanges !== null)
    Queries.updateNodesAsSynced(changes.localChanges)

  Queries.flagFileAsSynced(changes.file)
  return R.evolve(changesToSummary)(changes)
};

const addPositions = changes => {
  const positions = [];
  for (var n = 0; n < changes.fileNodes.length; n++) {
    positions.push(changes.fileNodes[n].position)
  }
  changes.positions = positions
  return changes
};

const fixEmptyExternalChanges = R.when(
  R.propEq('externalChanges', { changedNodes: []}), R.assoc('externalChanges', null));

const clean = R.omit(['fileNodes', 'file', 'positions'])

// * syncFile

const syncFile = promisePipe(
  getChanges,
  applyFileHeaderExternalChanges,
  R.cond([
    [onlyLocalChangesP, applyLocalChanges],
    [onlyExternalChangesP, promisePipe(
      applyExternalChanges('delete'),
      addPositions,
      applyExternalChanges('add'),
      rejectNotChangedNodes,
      // R.tap(cn=> console.log(cn.externalChanges.changedNodes)),
      applyExternalChanges('update')
    )],
    [bothExternalAndLocalChangesP, mergeChanges],
    [R.T, R.identity],
  ]),
  fixEmptyExternalChanges,
  generateReportAndUpdateStatus,
  clean,
)

const syncAllFiles = () => Queries.getFiles()
// .then(files => files.filter(file => file.path != undefined))
      .then(
        files => Promise.all(files.filter(file => file.path != null).map(file => syncFile(file)))).then(res => res.filter(i => i !== null))

const getExternallyChangedFiles = async () => {
  const exportedFiles = (await Queries.getFiles()).filter(f => f.path !== null)

  const mTimes = await Promise.all(
    exportedFiles.map(file => getNewExternalMtime(file)))

  const res = exportedFiles
        .map((f, idx) => ({id: f.id, mtime: mTimes[idx]}))
        .filter(o => o.mtime)

  return res
};


// * Exports

export default {
  importFile,
  getExternallyChangedFiles,
  createFileFromString,
  syncDb: () => syncAllFiles(),
  syncFile: async (id) => {
    const file = (await Queries.getFiles()).filter(f => f.id === id)[0]
    return syncFile(file);
  }

}
