export default {
  name: 'OrgNode',
  primaryKey: 'id',
  properties: {
    // Internal
    id: 'string',
    file: 'OrgFile',

    // Sync
    isChanged: { type: 'bool', default: false },
    isAdded: { type: 'bool', default: false },

    // Do not delete, it is used at moment for sync purposes
    // rawContent: 'string?',
    // rawHeadline: 'string?',

    // Position
    level: 'int', // horizontal position - is not used to crc check
    position: 'double', // vertical position - is not used to crc check

    // Org data
    headline: 'string',
    content: { type: 'string', default: '' },
    tags: 'OrgTag[]',
    todo: 'string?',
    timestamps: 'OrgTimestamp[]',
    closed: 'date?',
    priority: 'string?',
    drawers: 'string?', // json string
  },
};
