import DbHelper from './DbHelper';

// * Db

let Realm = undefined;
let RealmOptions = {};

export const configureDb = realm => {
  Realm = realm;
};

export const openRealm = schema =>
  Realm.open({
    deleteRealmIfMigrationNeeded: true,
    schema,
  });

// * Exports

export default realm => ({
  cleanUpDatabase: () => realm.write(() => realm.deleteAll()),
  sync: () => realm.objects('OrgFile').forEach(file => file),
});

export let dbConn = undefined;

export const connectDb = () => {
  DbHelper.init();
  dbConn = DbHelper.getInstance();
  return dbConn;
};
