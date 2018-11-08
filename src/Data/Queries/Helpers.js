// * Helpers
// ** Imports

import R from 'ramda';

import { dbConn } from '../Db/Db';

// * Functions

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

export const getObjects = (model, ...filterArgs) =>
  dbConn.then(
    realm =>
      filterArgs.length > 0
        ? realm.objects(model).filtered(...filterArgs)
        : realm.objects(model),
  );
