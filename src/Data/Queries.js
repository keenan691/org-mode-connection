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

const mapNodeToPlainObject = (node) => ({
  id: node.id,
  level: node.level,
  headline: node.headline,
  content: node.content,
  category: null,
  todo: node.todo,
  priority: node.priority,
  drawers: node.drawers,
  tags: Array.from(node.tags).map(t => t.name),
  timestamps: Array.from(node.timestamps).map(t => ({
    type: t.type,
    warningPeriod: t.warningPeriod,
    repeater: t.repeater,
    date: t.date,
    dateRangeEnd: t.dateRangeEnd}))})

const generateNodeId = (node, file, position) => file.path + position

// Prepare parsed nodes for adding to db
export const prepareNodes = (parsedNodes, file) =>
  parsedNodes.map(node => R.pipe(
    R.merge({
      id: generateNodeId(node, file, node.position),
      originalPosition: node.position,
      file}),
    R.evolve({
      drawers: JSON.stringify}))(node));

// ** Files

const mapFileToPlainObject = (f) => ({
  id: f.path,
  type: f.type,
  name: f.name,
  size: f.size,
  ctime: f.ctime,
  mtime: f.mtime,
  path: f.path,
  title: f.title,
  content: f.content,
  metadata: f.metadata,
  category: f.category,
  lastSync: f.lastSync,
  isChanged: f.isChanged,
  isConflicted: f.isConflicted,});

// ** Realm helpers

export const queryRealm = (model, filter) => dbConn.then(realm => {
  let res = realm.objects(model)
  return filter ? res.filtered(filter) : res});

export const deleteRealmObject = (obj, alsoDelete=[]) => dbConn.then(realm => realm.write(() => realm.delete(obj)))

export const getObjectByIdAndEnhance = (objSchema, enhanceFunction) => (id) => dbConn.then(realm => {
  const res = realm.objects(objSchema).filtered('id = $0', id)
  return res.length === 1 ? enhanceFunction(res[0]) : null})

const getObjects = (model, ...filterArgs) => dbConn.then(
  realm =>
    filterArgs.length > 0 ?
    realm.objects(model).filtered(...filterArgs) :
    realm.objects(model));

// ** Timestamps

export const getTimestamp = (node, type) => R.head(node.timestamps.filtered(`type = "${type}"`))

export const addTimestamp = (node, type, timestampObj) => dbConn.then(realm => realm.write(() => {
  // Delete old timestamps of given type
  const oldTimestamp = getTimestamp(node, type)
  if (oldTimestamp) realm.delete(oldTimestamp)

  markNodeAsChanged(node)
  // Create new timestamp if value is not set to null
  if (timestampObj && timestampObj.hasOwnProperty('date')) {
    node.timestamps.push(R.merge(timestampObj, { type }))}}));

// * TODO [6/10] Node methods

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

// * Queries
// ** DONE [1/3] Add

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

      // Creating node objects
      prepareNodes(nodes, orgFile).forEach(node => {
        const orgNode = realm.create('OrgNode', node, true)})

      return 1}))})

// ** DONE [6/6] Get

const getNodes = (...filter) => getObjects('OrgNode', ...filter)
const getFiles = () => getObjects('OrgFile');
const getAgenda = (dateStart, dateEnd) => getObjects('OrgTimestamp', 'date >= $0 && date <= $1', dateStart, dateEnd)
const getNodeById = getObjectByIdAndEnhance('OrgNode', enhanceNode)
const search = (term) => getObjects('OrgNode', 'headline CONTAINS[c] $0 || content CONTAINS[c] $0', term)

// ** Get as plain objects

// Returns whole file content including nodes as plain object
const getFileAsPlainObject = (id) => dbConn.then(realm => {
  const f = realm.objects('OrgFile').filtered(`path = '${id}'`)[0]
  const filePlain = mapFileToPlainObject(f);
  const nodesPlain = {
    nodes: Array.from(f.nodes).map(mapNodeToPlainObject)}
  return Object.assign(filePlain, nodesPlain)})

// Return only files fields as plain object, without nodes
const getAllFilesAsPlainObject = () => getFiles().then(files => files.map(mapFileToPlainObject))

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

// Flags file as synced and updates file stats
const flagFileAsSynced = (file) =>
      FileAccess.stat(file.path).then(
        ({name, size, mtime, ctime}) =>
          dbConn.then(realm => realm.write(
            () => Object.assign(file, {
              name,
              size,
              mtime,
              ctime,
              isChanged: false,
              isConflicted: false }))))

const updateNodes = (listOfNodesAndChanges, setForAll) => dbConn.then(realm => realm.write(
  () => listOfNodesAndChanges.forEach(group => {
    let [realmNode, toUpdate] = group
    if (setForAll) Object.assign(toUpdate, setForAll)
    Object.assign(realmNode, toUpdate)})))

// * Export

export default {
  clearDb: () => dbConn.then(realm => Db(realm).cleanUpDatabase()),
  getFileAsPlainObject,
  getAllFilesAsPlainObject,
  addFile,
  addNodes,
  getFiles,
  getNodes,
  getAgenda,
  getNodeById,
  search,
  deleteNode,
  deleteNodes,
  updateNodes,
  flagFileAsSynced,
}
