// * Imports

import R from "ramda";

import { parse } from '../OrgFormat/Parser';
import { promisePipe } from '../Helpers/Functions';
import Db from './Db/Db';
import DbHelper  from './Db/DbHelper';
import FileAccess from '../Helpers/FileAccess';
import OrgNode from './Models/OrgNode';
import exportNodeToOrgRepr from '../OrgFormat/Export';

// * Init

let dbConn = undefined

export const connectDb = () => {
  DbHelper.init()
  dbConn = DbHelper.getInstance();
};

// * Functions

// ** Nodes

const generateNodeId = (node, file, position) => file.path + position; // TODO it's fake ethod. Id have to be realy uniqu. And cant depend on position, becouse position can change

export const prepareNodes = (parsedNodes, file) =>
  parsedNodes.map(node => R.pipe(
    R.merge({
      id: generateNodeId(node, file, node.position),
      originalPosition: node.position,
      file}),
    R.evolve({
      drawers: JSON.stringify
    }))(node));

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

// * TODO [6/10] Node container
// - [-] add/delete
//   - [ ] deleteNode - only if has no children
//   - [ ] addNode subnodes - update position of every nodes after one and save old position for sycnc purposes
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

const RealmOrgNodeGetters = function () {
  const nodeProps = Object.getOwnPropertyNames(OrgNode.properties)
  const timeStampProps = ['closed', 'scheduled', 'deadline'];
  const obj = {}

  nodeProps.forEach(
    prop => obj[prop] = {
      get: function() {
        return this._node[prop]}})

  timeStampProps.forEach(
    prop => obj[prop] = {
      get: function() {
        return getTimestamp(this._node, prop)}})

  obj['drawers'] = {
    get: function() {
      return this._node.drawers ? JSON.parse(this._node.drawers) : ''}}

  return obj}();

const OrgNodeMethods = Object.create(null);
OrgNodeMethods.prototype = {
  setNodeProperty  (name, value) {
    return dbConn.then(realm => realm.write(() => {
      markNodeAsChanged(this._node)
      return this._node[name] = value}))},

  delete (){ return deleteRealmObject(this._node)},
  toOrgRepr () { return exportNodeToOrgRepr(node); },
  schedule (timestampObj) { return addTimestamp(this._node, 'scheduled', timestampObj)},
  setDeadline (timestampObj) { return addTimestamp(this._node, 'deadline', timestampObj)},
  setTodo (val) { return this.setNodeProperty('todo', val)}};

export const enhanceNode = realmNode => {
  // let enhancedNode = {
  //   get isChanged(){ return realmNode.isChanged },
  //   get todo(){ return realmNode.todo },
  //   set todo(val){ setNodeProperty(realmNode, 'todo', val) }
  // }

  let obj = Object.create(OrgNodeMethods.prototype, RealmOrgNodeGetters)
  Object.assign(obj, { _node: realmNode })

  return obj
  // // Generic

  return node}

// * TODO [1/4] File container
export const enhanceFile = (file) => {
  file.delete = () => deleteRealmObject(file)
  return file
};

// * Queries
// ** DONE [1/3] Add
// CLOSED: [2018-03-12 pon 23:57]
// - [X] addFile
//   - [X] OrgFile
//   - [X] OrgNode
//   - [X] OrgTimestamps
// - [ ] addNode as child to file/other node and update positions of rest of nodes
// - [ ] addNodes without updating positions

const addNodes = (nodes, file) => dbConn.then(realm => realm.write(
  () => prepareNodes(nodes, file).forEach(node => {
    const orgNode = realm.create('OrgNode', node, true)})));

const addFile = (filepath, type='agenda') => FileAccess.read(filepath).then(fileContent => {
  const nodes = parse(fileContent);
  dbConn.then(
    realm => realm.write(() => {

      // Creating file object
      const orgFile = realm.create('OrgFile', {
        path: filepath,
        lastSync: new Date(),
        type})
      // console.log(orgFile)
      // console.log('add file')
      // console.log('realm', realm)

      // Creating node objects
      prepareNodes(nodes, orgFile).forEach(node => {
        const orgNode = realm.create('OrgNode', node, true)})

      return 1
    }))})

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
const getFiles = () => getObjects('OrgFile');
const getAgenda = (dateStart, dateEnd) => getObjects('OrgTimestamp', 'date >= $0 && date <= $1', dateStart, dateEnd)
const getNodeById = getObjectByIdAndEnhance('OrgNode', enhanceNode)
const getFileById = getObjectByIdAndEnhance('OrgFile', enhanceFile)
const search = (term) => getObjects('OrgNode', 'headline CONTAINS[c] $0 || content CONTAINS[c] $0', term)

// ** TODO [2/3] Delete
// - [X] deleteNodes
// - [X] deleteNode
// - [ ] deleteFile

const deleteNode = (node) => dbConn.then(realm => realm.write(
  () => realm.delete(node)));
const deleteNodes = (nodes) => dbConn.then(realm => realm.write(
  () => nodes.forEach(node => realm.delete(node))));

// ** TODO [1/1] Update
// - [X] updateNodes

const flagFileAsSynced = (file) => dbConn.then(realm => realm.write(
  () => Object.assign(file, { isChanged: false, isConflicted: false })));

const updateNodes = (listOfNodesAndChanges, setForAll) => dbConn.then(realm => realm.write(
  () => listOfNodesAndChanges.forEach(group => {
    let [realmNode, toUpdate] = group
    if (setForAll) Object.assign(toUpdate, setForAll)
    Object.assign(realmNode, toUpdate)})))

// * Export

export default {
  clearDb: () => dbConn.then(realm => Db(realm).cleanUpDatabase()),
  addFile,
  addNodes,
  getFiles,
  getNodes,
  getAgenda,
  getFileById,
  getNodeById,
  search,
  deleteNode,
  deleteNodes,
  updateNodes,
  flagFileAsSynced,
}
