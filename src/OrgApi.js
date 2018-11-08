import { asOrgDate } from './OrgFormat/Transforms';
import { configureFileAccess } from './Helpers/FileAccess';
import { headlineR } from './OrgApi';
import Db, { configureDb, connectDb } from './Data/Db/Db';
import NodeContentParser from './OrgFormat/AtomicParsers/NodeContentParser';
import Queries from './Data/Queries';
import Sync from './Data/Sync';

const Configure = {
  configureFileAccess,
  configureDb,
  connectDb,
};

const Api = Object.assign({}, Queries, Db, Sync, Configure);

export default Api;

export { NodeContentParser, asOrgDate, headlineR };
