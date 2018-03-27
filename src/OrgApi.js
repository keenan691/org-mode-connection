/** @flow */

import Db from './Data/Db/Db';
import Queries from './Data/Queries';
import Sync from './Data/Sync';

const Api = Object.assign({}, Queries, Db, Sync);

export default Api
