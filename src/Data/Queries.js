// * Imports

import R from "ramda";

import {
  mapFileToPlainObject,
  mapNodeToPlainObject,
  mapNodeToSearchResult,
  prepareNodes,
  uniqueId
} from "./Transforms";
import { parse } from "../OrgFormat/Parser";
import { promisePipe } from "../Helpers/Functions";
import Db from "./Db/Db";
import DbHelper from "./Db/DbHelper";
import FileAccess from "../Helpers/FileAccess";
import OrgNode from "./Models/OrgNode";
import exportNodeToOrgRepr from "../OrgFormat/Export";

// * Init

let dbConn = undefined;

export const connectDb = () => {
  DbHelper.init();
  dbConn = DbHelper.getInstance();
  return dbConn;
};

// * Realm helpers

const getObjectById = R.curry((model, realm, id) => {
  const res = realm.objects(model).filtered(`id = "${id}"`);
  return res.length === 1 ? res[0] : null;
});

export const queryRealm = (model, filter) =>
  dbConn.then(realm => {
    let res = realm.objects(model);
    return filter ? res.filtered(filter) : res;
  });

export const deleteRealmObject = (obj, alsoDelete = []) =>
  dbConn.then(realm => realm.write(() => realm.delete(obj)));

export const getObjectByIdAndEnhance = (objSchema, enhanceFunction) => id =>
  dbConn.then(realm => {
    const res = realm.objects(objSchema).filtered("id = $0", id);
    return res.length === 1 ? enhanceFunction(res[0]) : null;
  });

export const getObjects = (model, ...filterArgs) =>
  dbConn.then(
    realm =>
      filterArgs.length > 0
        ? realm.objects(model).filtered(...filterArgs)
        : realm.objects(model)
  );

// * Functions

const markNodeAsChanged = node => {
  node.isChanged = true;
  node.file.isChanged = true;
};

const RealmOrgNodeGetters = (function() {
  const nodeProps = Object.getOwnPropertyNames(OrgNode.properties);
  const timeStampProps = ["closed", "scheduled", "deadline"];
  const obj = {};

  nodeProps.forEach(
    prop =>
      (obj[prop] = {
        get: function() {
          return this._node[prop];
        }
      })
  );

  timeStampProps.forEach(
    prop =>
      (obj[prop] = {
        get: function() {
          return getTimestamp(this._node, prop);
        }
      })
  );

  obj["drawers"] = {
    get: function() {
      return this._node.drawers ? JSON.parse(this._node.drawers) : "";
    }
  };

  return obj;
})();

const OrgNodeMethods = Object.create(null);
OrgNodeMethods.prototype = {
  setNodeProperty(name, value) {
    return dbConn.then(realm =>
      realm.write(() => {
        markNodeAsChanged(this._node);
        return (this._node[name] = value);
      })
    );
  },

  delete() {
    return deleteRealmObject(this._node);
  },
  toOrgRepr() {
    return exportNodeToOrgRepr(node);
  },
  schedule(timestampObj) {
    return addTimestamp(this._node, "scheduled", timestampObj);
  },
  setDeadline(timestampObj) {
    return addTimestamp(this._node, "deadline", timestampObj);
  },
  setTodo(val) {
    return this.setNodeProperty("todo", val);
  }
};

export const enhanceNode = realmNode => {
  // let enhancedNode = {
  //   get isChanged(){ return realmNode.isChanged },
  //   get todo(){ return realmNode.todo },
  //   set todo(val){ setNodeProperty(realmNode, 'todo', val) }
  // }

  let obj = Object.create(OrgNodeMethods.prototype, RealmOrgNodeGetters);
  Object.assign(obj, { _node: realmNode });

  return obj;
  // // Generic

  return node;
};

// * Helpers

export const getOrCreateNodeByHeadline = (file, headline) => {
  // use headline title as headline for now
  let created = false;

  const nodes = file.nodes.filtered(`headline = "${headline}"`);
  if (nodes.length > 0) return [nodes[0], false];

  // create new node
  const newNode = prepareNodes([
    {
      headline,
      content: "",
      level: 1,
      position: file.nodes.length,
      isAdded: true,
      file
    }
  ])[0];

  return [newNode, true];
};

const getNextNodeSameLevel = node =>
  node.file.nodes.filtered(
    `level = "${node.level}" AND position > ${node.position}`
  )[0];

// Enahances node with position and level if these props are undefined
export const enhanceNodeWithPosition = (file, targetNode) =>
  R.when(R.propEq("position", undefined), node => {
    let level;
    let position;

    if (targetNode) {
      // Add as child of target node
      const nextNodeSameLevel = getNextNodeSameLevel(targetNode);
      position = nextNodeSameLevel
        ? nextNodeSameLevel.position
        : file.nodes.length;
      level = targetNode.level + 1;
    } else {
      // Add to end of file
      position = file.nodes.length;
      level = 1;
    }

    return R.merge(node, { level, position });
  });

// * Queries

// ** Get

const getFileById = getObjectById("OrgFile");

const getNodeById = getObjectById("OrgNode");

const getFiles = () => getObjects("OrgFile");

const getNodes = (...filter) => getObjects("OrgNode", ...filter);

// ** Add/delete

export const addNodes = (nodes, insertPosition) =>
  dbConn.then(realm => {
    const { fileId, nodeId, headline } = insertPosition;
    const file = getFileById(realm, fileId);
    let enhance;
    const results = [];

    if (nodeId) {
      const targetNode = getNodeById(realm, nodeId);
      enhance = enhanceNodeWithPosition(file, targetNode);
    } else if (headline) {
      // Append as last child of headline
      const [targetNode, created] = getOrCreateNodeByHeadline(file, headline);
      if (created) realm.write(() => realm.create("OrgNode", targetNode));
      enhance = enhanceNodeWithPosition(file, targetNode);
    } else {
      // Append to end of file if node doasn't have defined position
      enhance = enhanceNodeWithPosition(file);
    }

    realm.write(() =>
      prepareNodes(nodes, file).forEach(node => {
        const enhancedNode = enhance(node);

        if (headline || nodeId) {
          // update next nodes positions, if node will be appended as other nodes child
          const toShift = file.nodes.filtered(
            `position >= "${enhancedNode.position}"`
          );
          for (var i = 0; i < toShift.length; i++) {
            toShift[i].position += 1;
          }
        }

        realm.create("OrgNode", enhancedNode, true);
        results.push(enhancedNode);
      })
    );

    return results;
  });

export const addFile = title =>
  dbConn.then(realm =>
    realm.write(() => {
      realm.create("OrgFile", {
        id: uniqueId(),
        title
      });
    })
  );

export const deleteNodeById = nodeId =>
  dbConn.then(realm =>
    realm.write(() => {
      const node = getNodeById(realm, nodeId);
      realm.delete(node.timestamps);
      realm.delete(node);
    })
  );

export const deleteFileById = fileId =>
  dbConn.then(realm =>
    realm.write(() => {
      const file = getFileById(realm, fileId);
      for (var i = 0; i < file.nodes.length; i++) {
        const node = file.nodes[i];
        realm.delete(node.timestamps);
      }

      realm.delete(file.nodes);
      realm.delete(file);
      // console.log(realm.objects("OrgNode").length);
    })
  );

const deleteNodes = nodes =>
  dbConn.then(realm =>
    realm.write(() => nodes.forEach(node => realm.delete(node)))
  );

// ** Update

// Flags file as synced and updates file stats
const flagFileAsSynced = file =>
  FileAccess.stat(file.path).then(stats =>
    dbConn.then(realm =>
      realm.write(() =>
        Object.assign(file, {
          size: stats.size,
          mtime: stats.mtime,
          ctime: stats.ctime,
          isChanged: false,
          isConflicted: false
        })
      )
    )
  );

export const updateNodeById = nodeObj =>
  dbConn.then(realm =>
    realm.write(() => {
      deleteNodeById(nodeObj.id);
      realm.create("OrgNode", nodeObj);
    })
  );

const updateNodes = (listOfNodesAndChanges, commonChanges) =>
  dbConn.then(realm =>
    realm.write(() =>
      listOfNodesAndChanges.forEach(group => {
        let [node, newProps] = group;
        if (commonChanges) Object.assign(newProps, commonChanges);
        Object.assign(node, newProps);
      })
    )
  );

const updateFile = (id, changes) =>
  dbConn.then(realm =>
    realm.write(() => {
      const file = getFileById(realm, id);
      const toMerge = R.evolve({ metadata: JSON.stringify }, changes);
      Object.assign(file, toMerge);
    })
  );

// ** Search

const removeNeutralFilters = R.reject(R.equals(0));

const prepareSearchQueries = (fieldName, filter) =>
  R.pipe(
    R.partition(R.equals(1)), // Partition to positive and negative filters
    R.converge(Array, [
      R.pipe(
        R.head,
        R.keys,
        R.map(value => `${fieldName} = "${value}"`),
        R.join(" || ")
      ),
      R.pipe(
        R.last,
        R.keys,
        R.map(value => `${fieldName} = "${value}"`),
        R.join(" || "),
        R.when(R.complement(R.isEmpty), x => `NOT (${x})`)
      )
    ])
  )(filter);

const search = ({
  searchTerm,
  todos,
  tags,
  priority,
  isScheduled,
  hasDeadline
}) =>
  getObjects("OrgNode").then(nodes => {
    let filteredNodes = nodes;
    priority = removeNeutralFilters(priority);
    todos = removeNeutralFilters(todos);
    tags = removeNeutralFilters(tags);

    if (searchTerm) {
      filteredNodes = filteredNodes.filtered(
        "headline CONTAINS[c] $0 || content CONTAINS[c] $0",
        searchTerm
      );
    }

    if (isScheduled) {
      filteredNodes = filteredNodes.filtered('timestamps.type = "scheduled"');
    }

    if (hasDeadline) {
      filteredNodes = filteredNodes.filtered('timestamps.type = "deadline"');
    }

    if (!R.isEmpty(todos)) {
      const [positiveQuery, negativeQuery] = prepareSearchQueries(
        "todo",
        todos
      );
      const query = positiveQuery || negativeQuery;
      filteredNodes = filteredNodes.filtered("todo != null");
      filteredNodes = filteredNodes.filtered(query);
    }

    if (!R.isEmpty(priority)) {
      const [positiveQuery, negativeQuery] = prepareSearchQueries(
        "priority",
        priority
      );
      const query = positiveQuery || negativeQuery;
      filteredNodes = filteredNodes.filtered("priority != null");
      filteredNodes = filteredNodes.filtered(query);
    }

    if (!R.isEmpty(tags)) {
      const [positiveQuery, negativeQuery] = prepareSearchQueries(
        "tags.name",
        tags
      );

      if (!positiveQuery && R.isEmpty(todos)) {
        filteredNodes = filteredNodes.filtered("tags.@size > 0");
      }

      const query = R.pipe(R.reject(R.isEmpty), R.join(" AND "))([
        positiveQuery,
        negativeQuery
      ]);
      filteredNodes = filteredNodes.filtered(query);
    }

    // In case if non of filters was applied return empty result
    if (filteredNodes === nodes) {
      return [];
    }

    return mapNodesToSearchResults(filteredNodes);
  });

// ** Get as plain objects

export const mapNodesToPlainObject = nodes =>
  Array.from(nodes).map(mapNodeToPlainObject);
const mapNodesToSearchResults = nodes =>
  Array.from(nodes).map(mapNodeToSearchResult);

// Returns whole file content including nodes as plain object
const getFileAsPlainObject = id =>
  dbConn.then(realm => {
    const f = realm.objects("OrgFile").filtered(`path = '${id}'`)[0];
    const filePlain = mapFileToPlainObject(f);
    return {
      fileData: filePlain,
      nodesList: mapNodesToPlainObject(f.nodes.sorted("position"))
    };
  });

// Return only files fields as plain object, without nodes
const getAllFilesAsPlainObject = () =>
  getFiles().then(files => files.map(mapFileToPlainObject));
const getTagsAsPlainObject = () =>
  getObjects("OrgTag").then(tags => tags.map(tag => tag.name));

// ** Timestamps

export const getTimestamp = (node, type) =>
  R.head(node.timestamps.filtered(`type = "${type}"`));

export const addTimestamp = (node, type, timestampObj) =>
  dbConn.then(realm =>
    realm.write(() => {
      // Delete old timestamps of given type
      const oldTimestamp = getTimestamp(node, type);
      if (oldTimestamp) realm.delete(oldTimestamp);

      markNodeAsChanged(node);
      // Create new timestamp if value is not set to null
      if (timestampObj && timestampObj.hasOwnProperty("date")) {
        node.timestamps.push(R.merge(timestampObj, { type }));
      }
    })
  );

// ** Agenda

const getAgenda = (dateStart, dateEnd) =>
  getObjects("OrgTimestamp", "date >= $0 && date <= $1", dateStart, dateEnd);

// * Export

export default {
  addNodes,
  addFile,
  clearDb: () => dbConn.then(realm => Db(realm).cleanUpDatabase()),
  connectDb,
  deleteNodeById,
  deleteNodes,
  flagFileAsSynced,
  getAgenda,
  getAllFilesAsPlainObject,
  getFileAsPlainObject,
  getFiles,
  getNodeById,
  getNodes,
  getTagsAsPlainObject,
  search,
  updateFile,
  updateNodeById,
  updateNodes
};
