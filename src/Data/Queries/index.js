// * Imports

import Db, { dbConn } from '../Db/Db';
import PlainObjectQueries from './PlainObjectQueries';
import RealmQueries from './RealmQueries';
import SearchQueries from './SearchQueries';
import UpdateQueries from './UpdateQueries';

export default {
  ...RealmQueries,
  ...PlainObjectQueries,
  ...UpdateQueries,
  ...SearchQueries,
  clearDb: () => dbConn.then(realm => Db(realm).cleanUpDatabase()),
};
