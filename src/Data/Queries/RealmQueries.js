// * RealmQueries
// ** Imports

import R from 'ramda';

import { dbConn } from '../Db/Db';
import { prepareNodes } from '../Transforms';
import FileAccess from '../../Helpers/FileAccess';

// ** Helpers

export const getObjects = (model, ...filterArgs) =>
  dbConn.then(
    realm =>
      filterArgs.length > 0
        ? realm.objects(model).filtered(...filterArgs)
        : realm.objects(model)
  );

const getObjectById = R.curry((model, realm, id) => {
  const res = realm.objects(model).filtered(`id = "${id}"`);
  return res.length === 1 ? res[0] : null;
});

export const getFileById = getObjectById('OrgFile');
export const getNodeById = getObjectById('OrgNode');

export const queryRealm = (model, filter) =>
  dbConn.then(realm => {
    let res = realm.objects(model);
    return filter ? res.filtered(filter) : res;
  });

export const deleteRealmObject = (obj, alsoDelete = []) =>
  dbConn.then(realm => realm.write(() => realm.delete(obj)));

export const getNodes = (...filter) => getObjects('OrgNode', ...filter);

// ** Queries

export const getFiles = async () => {
  const files = await getObjects('OrgFile');

  // return []
  // const acc = await FileAccess.exists(files[0].path)
  // console.log(acc)
  // console.log('DDDDDDDDDDDDDDDDDD')
  const existance = await Promise.all(
    files.map(f => (f.path === null ? new Promise(r => r(null)) : FileAccess.exists(f.path)))
  );

  const phisicallyDeletedFiles = [];
  existance.forEach((val, idx) => {
    if (!val) phisicallyDeletedFiles.push(idx);
  });

  if (phisicallyDeletedFiles.length > 0) {
    dbConn.then(realm =>
      realm.write(() =>
        phisicallyDeletedFiles.forEach(idx => {
          files[idx].path = null;
        })
      )
    );
  }

  return files;
};

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

// ** Exports

export default {
  getFiles,
  getNodeById,
  getNodes,
  getObjects,
};
