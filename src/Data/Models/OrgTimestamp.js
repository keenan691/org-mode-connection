/** @flow */

import Realm from 'realm';

class OrgTimestamp extends Realm.Object {}

OrgTimestamp.schema = {
  name: 'OrgTimestamp',
  properties: {
    node: 'OrgNode',
    date: 'date?',
    dateRangeEnd: 'date?',
    repeater: 'date?',
    warningPeriod: 'date?',
    nodes: { type: 'linkingObjects', objectType: 'OrgNode', property: 'timestamps' },
    type: 'string' // active, inActive, scheduled, deadline
  }
}

export default OrgTimestamp.schema
