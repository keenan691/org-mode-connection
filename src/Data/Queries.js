/** @flow */


// * Imports

import R from "ramda";
import { exportNodeToOrgRepr } from '../OrgFormat/Export';
import { parse } from '../OrgFormat/Parser';
import FileAccess from '../Helpers/FileAccess';
// import { syncFile } from './Sync';
import Db from './Db/Db';
import DbHelper  from './Db/DbHelper';

// * Init

DbHelper.init()
const dbConn = DbHelper.getInstance();

// * Functions
// ** Nodes

const generateNodeId = (node, file, position) => file.path + position; // TODO it's fake ethod

export const prepareNodes = (parsedNodes, file) =>
  parsedNodes.map((node) => R.merge(node, {
    id: generateNodeId(node, file, node.position),
    originalPosition: node.position,
    file}));

// ** Generic

export const queryRealm = (model, filter) => dbConn.then(realm => {
  let res = realm.objects(model)
  return filter ? res.filtered(filter) : res});

export const deleteRealmObject = (obj, alsoDelete=[]) => dbConn.then(realm => realm.write(() => realm.delete(obj)))
export const getObjectByIdAndEnhance = (objSchema, enhanceFunction) => (id) => dbConn.then(realm => {
  const res = realm.objects(objSchema).filtered('id = $0', id)
  return res.length === 1 ? enhanceFunction(res[0]) : null})

// ** Timestamps related functions

export const getTimestamp = (node, type) => R.head(node.timestamps.filtered(`type = "${type}"`))

export const addTimestamp = (node, type, timestampObj) => dbConn.then(realm => realm.write(() => {
  // Delete old timestamps of given type
  const oldTimestamp = getTimestamp(node, type)
  if (oldTimestamp) realm.delete(oldTimestamp)

  markNodeAsChanged(node)
  // Create new timestamp if value is not set to null
  if (timestampObj && timestampObj.hasOwnProperty('date')) {
      node.timestamps.push(R.merge(timestampObj, { type }))}}));


// * TODO [6/11] Node container
// - [ ] add/delete
//   - [ ] deleteNode
//   - [ ] addNode - update position of every nodes after one and save old position for sycnc purposes
// - [X] schedule
// - [X] deadline
// - [X] isChanged
// - [X] tag
// - [X] todo
// - [ ] todo state changes
// - [X] proirity
// - [ ] tree
//   - [ ] getDescendants
//   - [ ] childrens
//   - [ ] parent
// - [ ] clock
//   - [ ] clockIn
//   - [ ] clockOut
//   - [ ] clockCancel

// Enhances realmjs returned node object with additional methods.
const markNodeAsChanged = (node) => {
  node.isChanged = true
  node.file.isChanged = true};

const setNodeProperty = (node, name, value) => dbConn.then(realm => realm.write(() => {
  markNodeAsChanged(node)
  return node[name] = value}))

export const enhanceNode = node => {
  Object.defineProperties(node, {
    scheduled: { get: () => getTimestamp(node, 'scheduled') },
    deadline: { get: () => getTimestamp(node, 'deadline') }})

  // Generic
  node.delete = () => deleteRealmObject(node);
  node.toOrgRepr = () => exportNodeToOrgRepr(node);

  // Setters
  node.setPriority = (val) => setNodeProperty(node, "priority", val);
  node.setTodo = (val) => setNodeProperty(node, "todo", val)  // also add to todo states changes when is chaged to done. And vice versa when from done to todo
  node.setTags = (val) => setNodeProperty(node, "tags", val)

  // Timestamps
  node.setDeadline = (timestampObj) => addTimestamp(node, 'deadline', timestampObj)
  node.schedule = (timestampObj) => addTimestamp(node, 'scheduled', timestampObj)

  // Tree
  node.getDescendants = function (val) {} // nodes with same parent

  // Clock
  node.clockIn = function (val) {} // opens new time in node drawer
  node.clockOut = function (val) {} // finishes clock
  node.clockCancel = function (val) {} // cancels clock

  return node}

// * TODO [1/4] File container
// - [ ] delete file - metoda znajduje się w node kontenerze
// - [X] sync file
// - [ ] find headline / path of headlines or create
// - [ ] addNode
// - [ ] getLocallyChangedNodes

export const enhanceFile = (file) => {
  file.getAddedNodes = () => file.nodes.filtered('isAdded = true')
  // file.sync = () => syncFile(file)
  file.delete = () => deleteRealmObject(file)};


// * Queries
// ** DONE [1/1] Add
// CLOSED: [2018-03-12 pon 23:57]
// - [X] addFile
//   - [X] OrgFile
//   - [X] OrgNode
//   - [X] OrgTimestamps

const addFile = (filepath, type='agenda') => FileAccess.read(filepath).then(fileContent => {
  const nodes = parse(fileContent);
  dbConn.then(
    realm => realm.write(() => {

      // Creating file object
      const orgFile = realm.create('OrgFile', {
        path: filepath,
        lastSync: new Date(),
        type
      })

      // Creating node objects
      prepareNodes(nodes, orgFile).forEach(node => {
        const orgNode = realm.create('OrgNode', node, true)})}))})

// ** DONE [6/6] Retrive
// CLOSED: [2018-03-12 pon 19:16]

// - [X] getAgenda (name)
// - [X] search (term) => results
// - [X] getFiles () => results
// - [X] getNodes (filter) => results
// - [X] getNodeById (id) => enhance (node)
// - [X] getFileById (id) => enhance (file)

const getObjects = (model, ...filterArgs) => dbConn.then(
  realm =>
    filterArgs.length > 0 ?
    realm.objects(model).filtered(...filterArgs) :
    realm.objects(model));

const getNodes = (...filter) => getObjects('OrgNode', ...filter)
const getFiles = () => getObjects('OrgFile')
const getAgenda = (dateStart, dateEnd) => getObjects('OrgTimestamp', 'date >= $0 && date <= $1', dateStart, dateEnd)

const getNodeById = getObjectByIdAndEnhance('OrgNode', enhanceNode)
const getFileById = getObjectByIdAndEnhance('OrgFile', enhanceFile)

const search = (term) => getObjects('OrgNode', 'headline CONTAINS[c] $0 || content CONTAINS[c] $0', term)

// * Export

export default {
  clearDb: () => DbHelper.getInstance().then(realm => Db(realm).cleanUpDatabase()),
  addFile,
  getFiles,
  getNodes,
  getAgenda,
  getFileById,
  getNodeById,
  search,
}
