export default {
  name: 'OrgTag',
  primaryKey: 'name',
  properties: {
    name: 'string',
    isContextTag: 'bool',
    nodes: { type: 'linkingObjects', objectType: 'OrgNode', property: 'tags' },
  },
};
