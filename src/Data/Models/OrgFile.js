export default {
  name: 'OrgFile',
  primaryKey: 'path',
  properties: {

    // Related objects
    nodes: { type: 'linkingObjects', objectType: 'OrgNode', property: 'file'},

    // File
    path: 'string',
    name: 'string?',
    size: 'string?',
    mtime: 'date?',
    ctime: 'date?',

    // Sync
    type: 'string', // agenda, referenece
    lastSync: 'date?',
    isChanged: { type: 'bool', default: false},
    isConflicted: { type: 'bool', default: false},

    // Org
    metadata: 'string?',
    content: 'string?', // text before first headline stripped from metadata

    // Extracted metadata which have to be indexed
    category: 'string?',
    title: 'string?',
    // tags: 'tags',

  }
};
