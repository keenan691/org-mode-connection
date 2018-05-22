import R from "ramda";

import {
  mapFileToPlainObject,
  mapNodeToPlainObject,
  mapNodeToSearchResult,
  prepareNodes,
} from './Transforms';
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
  return dbConn};

// * Realm helpers

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

// * Functions

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

// ** Nodes

const addNodes = (nodes, file) => dbConn.then(realm => realm.write(
  () => prepareNodes(nodes, file).forEach(node => {
    const orgNode = realm.create('OrgNode', node, true)})));

const getNodes = (...filter) => getObjects('OrgNode', ...filter)

const deleteNode = (node) => dbConn.then(realm => realm.write(
  () => realm.delete(node)));

const deleteNodes = (nodes) => dbConn.then(realm => realm.write(
  () => nodes.forEach(node => realm.delete(node))));

const updateNodes = (listOfNodesAndChanges, setForAll) => dbConn.then(realm => realm.write(
  () => listOfNodesAndChanges.forEach(group => {
    let [realmNode, toUpdate] = group
    if (setForAll) Object.assign(toUpdate, setForAll)
    Object.assign(realmNode, toUpdate)})))

// ** Files

const getFiles = () => getObjects('OrgFile');

const getNodeById = getObjectByIdAndEnhance('OrgNode', enhanceNode)

// Flags file as synced and updates file stats
const flagFileAsSynced = (file) => FileAccess.stat(file.path).then(
  (stats) => dbConn.then(realm => realm.write(
    () => Object.assign(file, {
      size: stats.size,
      mtime: stats.mtime,
      ctime: stats.ctime,
      isChanged: false,
      isConflicted: false }))))


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

// ** Agenda

const getAgenda = (dateStart, dateEnd) => getObjects('OrgTimestamp', 'date >= $0 && date <= $1', dateStart, dateEnd)

// ** Get as plain objects

const mapNodesToPlainObject = (nodes) => Array.from(nodes).map(mapNodeToPlainObject)
const mapNodesToSearchResults = (nodes) => Array.from(nodes).map(mapNodeToSearchResult)

// Returns whole file content including nodes as plain object
const getFileAsPlainObject = (id) => dbConn.then(realm => {
  const f = realm.objects('OrgFile').filtered(`path = '${id}'`)[0]
  const filePlain = mapFileToPlainObject(f);
  return  {
    fileData: filePlain,
    nodesList: mapNodesToPlainObject(f.nodes.sorted('position'))
  }
})

// Return only files fields as plain object, without nodes
const getAllFilesAsPlainObject = () => getFiles().then(files => files.map(mapFileToPlainObject))
const getTagsAsPlainObject = () => getObjects('OrgTag').then(tags => tags.map(tag => tag.name));

// ** Search

const removeNeutralFilters = R.reject(R.equals(0))

const prepareSearchFilter = (fieldName, filter) => R.pipe(
  R.partition(R.equals(1)), // Partition to positive and negative filters
  R.converge(Array, [R.pipe(R.head, R.keys,
                            R.map(todo => `${fieldName} = "${todo}"`),
                            R.join(' || ')),
                     R.pipe(R.last, R.keys,
                            R.map(todo => `${fieldName} = "${todo}"`),
                            R.join(' || '),
                            R.when(R.complement(R.isEmpty),
                                   R.pipe(R.concat('NOT ('), R.concat(R.__, ')')))
                           )]))(filter);

const search = ({searchTerm,
                 todos,
                 tags,
                 priority,
                 isScheduled,
                 hasDeadline}) => getObjects('OrgNode').

      then(nodes => {

        let filteredNodes = nodes
        priority = removeNeutralFilters(priority)
        todos = removeNeutralFilters(todos)
        tags = removeNeutralFilters(tags)

        if (searchTerm) {
          filteredNodes = filteredNodes.
            filtered('headline CONTAINS[c] $0 || content CONTAINS[c] $0', searchTerm)}

        if (isScheduled) {
          filteredNodes = filteredNodes.filtered('timestamps.type = "scheduled"')
        }

        if (hasDeadline) {
          filteredNodes = filteredNodes.filtered('timestamps.type = "deadline"')
        }

        if (!R.isEmpty(todos)) {
          const [positiveQuery, negativeQuery] = prepareSearchFilter('todo', todos)
          const query = positiveQuery || negativeQuery;
          filteredNodes = filteredNodes.filtered('todo != null')
          filteredNodes = filteredNodes.filtered(query)
        }

        if (!R.isEmpty(priority)) {
          const [positiveQuery, negativeQuery] = prepareSearchFilter('priority', priority)
          const query = positiveQuery || negativeQuery;
          filteredNodes = filteredNodes.filtered('priority != null')
          filteredNodes = filteredNodes.filtered(query)
        }

        if (!R.isEmpty(tags)) {
          const [positiveQuery, negativeQuery] = prepareSearchFilter('tags.name', tags)

          if (!positiveQuery && R.isEmpty(todos)) {
            filteredNodes = filteredNodes.filtered('tags.@size > 0')
          }

          const query = R.pipe(R.reject(R.isEmpty), R.join(' AND '))([positiveQuery, negativeQuery])
          filteredNodes = filteredNodes.filtered(query)
        }

        // In case if non of filters was applied return empty result
        if (filteredNodes === nodes) {
          return []}

        return mapNodesToSearchResults(filteredNodes)})

// * Export

export default {
  clearDb: () => dbConn.then(realm => Db(realm).cleanUpDatabase()),
  getFileAsPlainObject,
  getAllFilesAsPlainObject,
  getTagsAsPlainObject,
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
  connectDb

}
