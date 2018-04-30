import { asOrgDate } from './OrgFormat/Transforms';
import { configureFileAccess } from './Helpers/FileAccess';
import Db, { configureDb } from './Data/Db/Db';
import NodeContentParser from './OrgFormat/AtomicParsers/NodeContentParser';
import Queries, { connectDb } from './Data/Queries';
import Sync from './Data/Sync';

// export asOrgDate

const Configure = {
  configureFileAccess,
  configureDb,
  connectDb}

const Api = Object.assign({}, Queries, Db, Sync, Configure)

export default Api

export { NodeContentParser, asOrgDate }
