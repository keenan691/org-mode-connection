import R from "ramda";
import moment from 'moment'

// * To db transforms

// const generateNodeId = (node, file, position) => file.path + position

export const uniqueId = () => {
  // desired length of Id
  var idStrLen = 32;
  // always start with a letter -- base 36 makes for a nice shortcut
  var idStr = (Math.floor((Math.random() * 25)) + 10).toString(36) + "_";
  // add a timestamp in milliseconds (base 36 again) as the base
  idStr += (new Date()).getTime().toString(36) + "_";
  // similar to above, complete the Id using random, alphanumeric characters
  do {
    idStr += (Math.floor((Math.random() * 35))).toString(36);
  } while (idStr.length < idStrLen);

  return (idStr);
}

// Prepare parsed nodes for adding to db
export const prepareNodes = (parsedNodes, file) =>
  parsedNodes.map(node => R.pipe(
    R.merge({
      id: uniqueId(),
      file}),
    R.evolve({
      drawers: JSON.stringify}))(node));

// * To plain object transform

export const pathToFileName = R.pipe(R.split('/'), R.last)

export const mapNodeToPlainObjectShort = (n) => {
  return {
    id: n.id,
    headline: n.headline,
    todo: n.todo,
    priority: n.priority,
    tags: Array.from(n.tags).map(t => t.name),
  }
}

export const mapNodeToPlainObject = (n, idx, array) => {
  const nextNode = array[idx + 1]
  return {
    id: n.id,
    level: n.level,
    position: n.position,
    headline: n.headline,
    content: n.content,
    category: null,
    todo: n.todo,
    priority: n.priority,
    drawers: n.drawers,
    tags: Array.from(n.tags).map(t => t.name),
    hasChildren: nextNode && nextNode.level > n.level,
    timestamps: Array.from(n.timestamps).map(t => ({
      type: t.type,
      warningPeriod: t.warningPeriod,
      repeater: t.repeater,
      date: t.date,
      dateRangeEnd: t.dateRangeEnd}))} }

export const mapNodeToSearchResult = (n) => ({
  id: n.id,
  level: n.level,
  headline: n.headline,
  content: n.content.slice(0, n.content.length < 100 ? n.content.length : 100).trim(),
  // content: '',
  fileId: n.file.id,
  todo: n.todo,
  priority: n.priority,
  tags: Array.from(n.tags).map(t => t.name),
  timestamps: Array.from(n.timestamps).map(t => ({
    type: t.type,
    warningPeriod: t.warningPeriod,
    repeater: t.repeater,
    date: t.date,
    dateRangeEnd: t.dateRangeEnd}))})

const safePushItemtoKey = (obj={}) => (key='', data={})  => R.ifElse(
  R.has(key),
  R.over(R.lensProp(key), R.append(data)),
  R.assoc(key, R.of(data))
)(obj);

export const mapAgendaToPlainObject = (timestamps) => timestamps.sorted('date').reduce(
  (acc, ts) => {
    const addDay = safePushItemtoKey(acc);
    const day = moment(ts.date).format('YYYY-MM-DD');
    const agendaDayItem = {
      date: ts.date,
      dateRangeEnd: ts.dateRangeEnd,
      repeater: ts.repeater,
      warningPeriod: ts.warningPeriod,
      type: ts.type,
      node: Array.from(ts.nodes).map(mapNodeToPlainObjectShort)[0]
    };

    return addDay(day, agendaDayItem)

  }, {})
// ({
//   date: t.date,
//   dateRangeEnd: t.dateRangeEnd,
//   repeater: t.repeater,
//   warningPeriod: t.warningPeriod,
//   type: t.type,
//   node: Array.from(t.nodes).map(mapNodeToPlainObjectShort)
//   // node: mapNodeToPlainObjectShort(t.node)
// });

export const mapFileToPlainObject = (f) => {
  const tocNodes = f.nodes.filtered('level = 1');
  const toc = [];
  const nodesData = {}
  for (var i = 0; i < tocNodes.length; i++) {
    const node = tocNodes[i];
    toc.push(node.id)
    nodesData[node.id] = mapNodeToPlainObject(node, node.position, f.nodes)
  }
  return {
    id: f.id,
    type: f.type,
    name: f.name,
    size: f.size,
    ctime: f.ctime,
    mtime: f.mtime,
    path: f.path,
    title: f.title,
    description: f.description,
    metadata: JSON.parse(f.metadata),
    category: f.category,
    lastSync: f.lastSync,
    isChanged: f.isChanged,
    isConflicted: f.isConflicted,
    toc,
    nodesData
  } };
