import R from "ramda";

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
  fileID: n.file.path,
  todo: n.todo,
  priority: n.priority,
  tags: Array.from(n.tags).map(t => t.name),
  timestamps: Array.from(n.timestamps).map(t => ({
    type: t.type,
    warningPeriod: t.warningPeriod,
    repeater: t.repeater,
    date: t.date,
    dateRangeEnd: t.dateRangeEnd}))})

export const mapFileToPlainObject = (f) => ({
  id: f.path,
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
  isConflicted: f.isConflicted,});
