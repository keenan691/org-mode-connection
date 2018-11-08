// * UpdateQueries
// ** Imports

import R from 'ramda';

import { dbConn } from '../Db/Db';
import { deleteRealmObject, getFileById, getNodeById } from './RealmQueries';
import { mapNodesToPlainObject } from './PlainObjectQueries';
import { prepareNodes, uniqueId } from '../Transforms';
import FileAccess from '../../Helpers/FileAccess';
import OrgNode from '../Models/OrgNode';

// ** Funcs

const getPrevNode = node =>
  node.file.nodes
    .filtered(`position < ${node.position}`)
    .sorted('position', true)[0];

const getNextNodeSameLevel = node =>
  node.file.nodes
    .filtered(`level < "${node.level + 1}" AND position > ${node.position}`)
    .sorted('position')[0];

const getLastNode = node => {
  const nodes = node.file.nodes.sorted('position');
  return nodes[nodes.length - 1];
};

const markNodeAsChanged = node => {
  node.isChanged = true;
  // node.file.isChanged = true;
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
      if (timestampObj && timestampObj.hasOwnProperty('date')) {
        node.timestamps.push(R.merge(timestampObj, { type }));
      }
    })
  );

const RealmOrgNodeGetters = (function() {
  const nodeProps = Object.getOwnPropertyNames(OrgNode.properties);
  const timeStampProps = ['closed', 'scheduled', 'deadline'];
  const obj = {};

  nodeProps.forEach(
    prop =>
      (obj[prop] = {
        get: function() {
          return this._node[prop];
        },
      })
  );

  timeStampProps.forEach(
    prop =>
      (obj[prop] = {
        get: function() {
          return getTimestamp(this._node, prop);
        },
      })
  );

  obj['drawers'] = {
    get: function() {
      return this._node.drawers ? JSON.parse(this._node.drawers) : '';
    },
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
    return addTimestamp(this._node, 'scheduled', timestampObj);
  },
  setDeadline(timestampObj) {
    return addTimestamp(this._node, 'deadline', timestampObj);
  },
  setTodo(val) {
    return this.setNodeProperty('todo', val);
  },
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

// Enahances node with position and level if these props are undefined
export const enhanceNodeWithPosition = (file, targetNode) =>
  R.when(R.propEq('position', undefined), node => {
    // Add to ond of file
    let level = 1;
    let position = file.nodes.length + 1;

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
        position = lastNode.position + 1;
      }
    }
    return R.merge(node, { level, position });
  });

// ** Queries

// *** Add

export const addNodes = async (
  nodes,
  insertPosition,
  externalChange = false,
  returnAddedNodes = true
) => {
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
    if (created) realm.write(() => realm.create('OrgNode', targetNode));
    enhance = enhanceNodeWithPosition(file, targetNode);
  } else {
    // Append to end of file if node doasn't have defined position
    enhance = enhanceNodeWithPosition(file);
  }

  /* ------------- add ------------- */

  realm.write(() =>
    prepareNodes(nodes, file).forEach(node => {
      const enhancedNode = enhance(
        externalChange ? node : R.merge(node, { isChanged: true })
      );
      let createdNode = realm.create('OrgNode', enhancedNode, true);
      results.push(createdNode);
      // file.isChanged = true;
    })
  );
  return returnAddedNodes ? mapNodesToPlainObject(results) : null;
};

export const addFile = title =>
  dbConn.then(realm =>
    realm.write(() => {
      const newFile = realm.create('OrgFile', {
        id: uniqueId(),
        metadata: JSON.stringify({
          TITLE: title,
        }),
      });
    })
  );

export const deleteNodeById = nodeId =>
  dbConn.then(realm =>
    realm.write(() => {
      const node = getNodeById(realm, nodeId);
      node.file.isChanged = true;
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

export const deleteNodes = nodes =>
  dbConn.then(realm =>
    realm.write(() => nodes.forEach(node => realm.delete(node)))
  );

// ** Update

export const getOrCreateNodeByHeadline = async (file, headline) => {
  // use headline title as headline for now
  let created = false;

  const nodes = file.nodes.filtered(`headline = "${headline}"`);
  if (nodes.length > 0) return [nodes[0], false];

  // create new node
  let newNode = prepareNodes([
    {
      headline,
      content: '',
      level: 1,
      position: file.nodes.length,
      isAdded: true,
      file,
    },
  ])[0];

  newNode = await dbConn.then(realm => {
    let res;
    realm.write(() => {
      res = realm.create('OrgNode', newNode);
      res.file.isChanged = true;
    });
    return res;
  });

  return [newNode, true];
};
// Flags file as synced and updates file stats
export const flagFileAsSynced = file =>
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

export const updateFile = (id, changes) =>
  dbConn.then(realm =>
    realm.write(() => {
      const file = getFileById(realm, id);
      const toMerge = R.evolve({ metadata: JSON.stringify }, changes);
      Object.assign(file, toMerge);
    })
  );

export const updateNodeById = (id, changes) =>
  dbConn.then(realm =>
    realm.write(() => {
      const node = realm.objects('OrgNode').filtered(`id = '${id}'`)[0];
      Object.assign(node, { ...R.omit(['id'], changes), isChanged: true });
      node.file.isChanged = true;
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

export const updateNodesAsSynced = nodes =>
  dbConn.then(realm =>
    realm.write(() => {
      nodes.update('isChanged', false);
      nodes.update('isAdded', false);
    })
  );

// ** Exports

export default {
  addNodes,
  addFile,
  deleteNodes,
  deleteFileById,
  deleteNodeById,
  updateFile,
  updateNodeById,
  updateNodes,
};
