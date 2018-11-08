/** @flow */

import { openRealm } from './Db';
import OrgFile from '../Models/OrgFile';
import OrgNode from '../Models/OrgNode';
import OrgTag from '../Models/OrgTag';
import OrgTimestamp from '../Models/OrgTimestamp';

const DbHelper = {
  realm: null,

  modelSchema: [OrgFile, OrgNode, OrgTag, OrgTimestamp],

  init() {
    this.realm = openRealm(this.modelSchema);
  },

  getInstance() {
    let instance = this.realm;
    if (!instance) {
      throw new Error('DbHelper.js :: Active Instance Not Set!');
    }
    return instance;
  },
};

export default DbHelper;
