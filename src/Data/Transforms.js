import R from "ramda";

const generateNodeId = (node, file, position) => file.path + position

// Prepare parsed nodes for adding to db
export const prepareNodes = (parsedNodes, file) =>
  parsedNodes.map(node => R.pipe(
    R.merge({
      id: generateNodeId(node, file, node.position),
      originalPosition: node.position,
      file}),
    R.evolve({
      drawers: JSON.stringify}))(node));

export const mapNodeToPlainObject = (n) => ({
  id: n.id,
  level: n.level,
  headline: n.headline,
  content: n.content,
  category: null,
  todo: n.todo,
  priority: n.priority,
  drawers: n.drawers,
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
