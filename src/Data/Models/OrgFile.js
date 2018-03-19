/** @flow */

// * OrgFile
// ** imports

import Realm from 'realm';

// ** object

class OrgFile extends Realm.Object {
}

// ** schema

OrgFile.schema = {
  name: 'OrgFile',
  primaryKey: 'path',
  properties: {

    // Related objects
    nodes: { type: 'linkingObjects', objectType: 'OrgNode', property: 'file'},

    // Identity props
    type: 'string', // agenda, referenece
    path: 'string',
    content: 'string?', // text before first headline stripped from metadata

    // Sync props
    lastSync: 'date?',
    isChanged: { type: 'bool', default: false},

    // Metadata props
    metadata: 'string?', // TODO json accessot

    // INDEXED METADATA
    // TODO If this changes - also changes `metadata` prop.
    category: 'string?',
    // tags: 'tags',
    title: 'string?',

  }
};

export default OrgFile.schema
