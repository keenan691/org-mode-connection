/** @flow */

import Db from './Data/Db/Db';
import Queries from './Data/Queries';

const Api = Object.assign({}, Queries, Db);

export default Api
