import { configureFileAccess } from './Helpers/FileAccess';
import Db, { configureDb } from './Data/Db/Db';
import Queries, { connectDb } from './Data/Queries';
import Sync from './Data/Sync';

const Configure = {
  configureFileAccess,
  configureDb,
  connectDb
}

const Api = Object.assign({}, Queries, Db, Sync, Configure)

export default Api
