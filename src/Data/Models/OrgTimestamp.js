export default  {
  name: 'OrgTimestamp',
  properties: {
    node: 'OrgNode',
    date: 'date?',
    dateWithTime: { type: 'bool', default: false },
    dateRangeEnd: 'date?',
    dateRangeWithTime: { type: 'bool', default: false },
    repeater: 'string?',
    warningPeriod: 'string?',
    nodes: { type: 'linkingObjects', objectType: 'OrgNode', property: 'timestamps' },
    type: 'string' // active, inActive, scheduled, deadline
  }
}
