/** @flow */

import Realm from 'realm';

class OrgTag extends Realm.Object {}

OrgTag.schema = {
  name: 'OrgTag',
  primaryKey: 'name',
  properties: {
    name: 'string',
    isContextTag: 'bool',
    nodes: { type: 'linkingObjects', objectType: 'OrgNode', property: 'tags' },
  }
};

export default OrgTag.schema
