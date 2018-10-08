// * Imports

import R from "ramda";
import moment from 'moment';

import {
  mapAgendaToPlainObject,
  mapFileToPlainObject,
  mapFilesToToc,
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

const getDescendants = (node, nodes) => {
  const lowerNodes = nodes
    .filtered(`position > "${node.position}"`)
    .sorted("position");
  return R.pipe(R.takeWhile(n => n.level > node.level))(lowerNodes);
};

const getAncestors = (node, nodes) => {
  const upperNodes = nodes
    .filtered(`position < "${node.position}"`)
    .sorted("position");
  return R.pipe(
    R.reverse,
    R.reduce(
      (acc, node) => {
        const level = node.level;
        const lastLevel = R.last(acc).level;
        if (level < lastLevel) {
          acc.push(node);
          if (level === 1) return R.reduced(acc);
        }
        return acc;
      },
      [node]
    ),
    R.drop(1),
    R.reverse
  )(upperNodes);
};

const markNodeAsChanged = node => {
  node.isChanged = true;
  // node.file.isChanged = true;
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
  setNodeProperty(nextNodeSameLevel, value) {
    return dbConn.then(realm =>
      realm.write(() => {
        markNodeAsChanged(this._node);
        return (this._node[nextNodeSameLevel] = value);
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

export const getOrCreateNodeByHeadline = async (file, headline) => {
  // use headline title as headline for now
  let created = false;

  const nodes = file.nodes.filtered(`headline = "${headline}"`);
  if (nodes.length > 0) return [nodes[0], false];

  // create new node
  let newNode = prepareNodes([
    {
      headline,
      content: "",
      level: 1,
      position: file.nodes.length,
      isAdded: true,
      file
    }
  ])[0];

  newNode = await dbConn.then(realm => {
    let res;
    realm.write(() => {
      res = realm.create("OrgNode", newNode);
      res.file.isChanged = true
    });
    return res;
  });

  return [newNode, true];
};

const getPrevNode = node =>
  node.file.nodes
    .filtered(`position < ${node.position}`)
    .sorted("position", true)[0];

const getNextNodeSameLevel = node =>
  node.file.nodes
    .filtered(`level = "${node.level}" AND position > ${node.position}`)
    .sorted("position")[0];

const getLastNode = node =>
      {
        const nodes = node.file.nodes.sorted("position")
        return nodes[nodes.length-1]
      }


// Enahances node with position and level if these props are undefined
export const enhanceNodeWithPosition = (file, targetNode) =>
  R.when(R.propEq("position", undefined), node => {
    // Add to ond of file
    let level = 1;
    let position = file.nodes.length +1;

    if (targetNode) {
      // Add as child of target node
      level = targetNode.level + 1;

      const nextNodeSameLevel = getNextNodeSameLevel(targetNode);
      if (nextNodeSameLevel) {
        const position2 = nextNodeSameLevel.position;
        const position1 = getPrevNode(nextNodeSameLevel).position;
        position = (position2 + position1) / 2;
      } else {
        // Use Position after last node
        const lastNode = getLastNode(targetNode);
        position = lastNode.position + 1
      }
    }
    return R.merge(node, { level, position });
  });

// * Queries

// ** Get

const getFileById = getObjectById("OrgFile");

const getNodeById = getObjectById("OrgNode");

const getFiles = () => {
  return getObjects("OrgFile")
};

const getNodes = (...filter) => getObjects("OrgNode", ...filter);

const getRelatedNodes = nodeId =>
  dbConn.then(realm => {
    const result = [];
    const node = getNodeById(realm, nodeId);
    const fileNodes = node.file.nodes;
    const ancestors = getAncestors(node, fileNodes);
    const descendants = getDescendants(node, fileNodes);

    return [
      ...mapNodesToPlainObject(ancestors),
      ...mapNodesToPlainObject([node]),
      ...mapNodesToPlainObject(descendants)
    ];
  });

const getAncestorsAsPlainObject = nodeId =>
  dbConn.then(realm => {
    console.tron.log(nodeId);
    const node = getNodeById(realm, nodeId);
    const ancestors = getAncestors(node, node.file.nodes);

    return [...mapNodesToPlainObject([...ancestors, node])];
  });

// ** Add/delete

export const addNodes = async (nodes, insertPosition, externalChange=false) => {
  const realm = await dbConn;
  const { fileId, nodeId, headline } = insertPosition;
  const file = getFileById(realm, fileId);
  let enhance;
  const results = [];

  /* ------------- prepare node ------------- */

  // Add level, position and id
  if (nodeId) {
    const targetNode = getNodeById(realm, nodeId);
    enhance = enhanceNodeWithPosition(file, targetNode);
  } else if (headline) {
    // Append as last child of headline
    const [targetNode, created] = await getOrCreateNodeByHeadline(
      file,
      headline
    );
    if (created) realm.write(() => realm.create("OrgNode", targetNode));
    enhance = enhanceNodeWithPosition(file, targetNode);
  } else {
    // Append to end of file if node doasn't have defined position
    enhance = enhanceNodeWithPosition(file);
  }

  /* ------------- add ------------- */

  realm.write(() =>
    prepareNodes(nodes, file).forEach(node => {
      const enhancedNode = enhance(
        externalChange ? node : R.merge(node, { isChanged: true }));
      let createdNode = realm.create("OrgNode", enhancedNode, true);
      results.push(createdNode);
      // file.isChanged = true;
    })
  );
  return mapNodesToPlainObject(results);
};
export const addFile = title =>
  dbConn.then(realm =>
    realm.write(() => {
      const newFile = realm.create("OrgFile", {
        id: uniqueId(),
        metadata: JSON.stringify({
          TITLE: title
        })
      });
    })
  );

export const deleteNodeById = nodeId =>
  dbConn.then(realm =>
    realm.write(() => {
      const node = getNodeById(realm, nodeId);
      node.file.isChanged = true
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
          lastSync: stats.mtime,
          isChanged: false,
          // isConflicted: false
        })
      )
    )
  );

export const updateNodeById = (id, changes) =>
  dbConn.then(realm =>
    realm.write(() => {
      const node = realm.objects("OrgNode").filtered(`id = '${id}'`)[0];
      Object.assign(node, { ...R.omit(["id"], changes), isChanged: true });
      node.file.isChanged = true
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

const updateNodesAsSynced = nodes =>
  dbConn.then(realm =>
    realm.write(() => {
      nodes.update("isChanged", false);
      nodes.update("isAdded", false);
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

    return mapNodesToSearchResults(filteredNodes.sorted("file.id"));
  });

// ** Get as plain objects

export const mapNodesToPlainObject = nodes =>
  Array.from(nodes).map(mapNodeToPlainObject);
const mapNodesToSearchResults = nodes =>
  Array.from(nodes).map(mapNodeToSearchResult);

// Returns whole file content including nodes as plain object
const getFileAsPlainObject = id =>
  dbConn.then(realm => {
    const f = realm.objects("OrgFile").filtered(`id = '${id}'`)[0];
    const filePlain = mapFileToPlainObject(f);
    return {
      fileData: filePlain,
      nodesList: mapNodesToPlainObject(f.nodes.sorted("position"))
    };
  });

// Return only files fields as plain object, without nodes
const getAllFilesAsPlainObject = () =>
  getFiles().then(files => files.map(mapFileToPlainObject));
const getTocs = () => getFiles().then(mapFilesToToc);
const getTagsAsPlainObject = () =>
  getObjects("OrgTag").then(tags => tags.map(tag => tag.name));

const addDay = (date, num) => moment(date).add(num, 'd').format('YYYY-MM-DD')
const getAgendaAsPlainObject = ({ start, end }) => {
  console.tron.log(start);
  return getObjects("OrgTimestamp")
    .then(ts =>
      ts
        .sorted("date")
          .filtered("date > $0 && date < $1", addDay(start, -1), addDay(end, 1))
        // .filtered("date > $0", '2018-09-05')
    )
    .then(mapAgendaToPlainObject);
};
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

const getAgenda = ({ dateStart, dateEnd }) => {
  let res;
  if (dateStart !== dateEnd) {
    // res = getObjects(
    //   "OrgTimestamp",
    //   "date >= $0 && date <= $1",
    //   dateStart,
    //   dateEnd
    // );
    // res = getObjects("OrgTimestamp", "date === $0", dateStart);
  } else {
    // res = getObjects("OrgTimestamp", "date === $0", dateStart);
  }

  // res = getObjects("OrgTimestamp", "date === $0", dateStart);
  console.tron.warn(res);
  console.tron.log(dateStart);
  console.tron.log(dateEnd);
  return res;
};

// * Export

export default {
  addNodes,
  addFile,
  clearDb: () => dbConn.then(realm => Db(realm).cleanUpDatabase()),
  connectDb,
  deleteNodeById,
  deleteNodes,
  deleteFileById,
  flagFileAsSynced,
  getOrCreateNodeByHeadline: async ({ fileId, headline }) => {
    const realm = await dbConn;
    const [node, created] = await getOrCreateNodeByHeadline(
      getFileById(realm, fileId),
      headline
    );
    return [mapNodeToSearchResult(node), created]
  },
  getAgenda,
  getAncestorsAsPlainObject,
  getAllFilesAsPlainObject,
  getFileAsPlainObject,
  getFiles,
  getNodeById,
  getNodes,
  getRelatedNodes,
  getTagsAsPlainObject,
  getAgendaAsPlainObject,
  getTocs,
  search,
  updateFile,
  updateNodeById,
  updateNodes,
  updateNodesAsSynced
};
