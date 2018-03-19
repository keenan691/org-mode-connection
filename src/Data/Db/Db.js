//@flow


// * Imports

import R from "ramda";
import Realm from 'realm';

import { parse } from '../../OrgFormat/Parser';
import FileAccess from '../../Helpers/FileAccess';

// * Db

export const openRealm = (schema) => Realm.open({
  deleteRealmIfMigrationNeeded: true,
  schema
});

// * Exports

export default (realm) => (
  {
    cleanUpDatabase: () => realm.write(() => realm.deleteAll()),
    sync: () => realm.objects('OrgFile').forEach((file) => file.sync())
  })
