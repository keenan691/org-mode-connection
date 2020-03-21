import { asOrgDate } from './OrgFormat/Transforms';
import { configureFileAccess } from './Helpers/FileAccess';
import { headlineR } from './OrgFormat/Regex';
import Db, { configureDb, connectDb } from './Data/Db/Db';
import NodeContentParser from './OrgFormat/AtomicParsers/NodeContentParser';
import Queries from './Data/Queries';
import Sync from './Data/Sync';
import { parse } from './OrgFormat/Parser';

const Configure = {
  configureFileAccess,
  configureDb,
  connectDb,
};

const OrgApi = { ...Queries, ...Db, ...Sync, ...Configure };

export default OrgApi;
export { OrgApi, NodeContentParser, asOrgDate, headlineR, parse };
