// * UpdateQueries
// ** Imports

import R from 'ramda';
import moment from 'moment';

import { dbConn } from '../Db/Db';
import {
  getFileById,
  getFiles,
  getNodeById,
  getObjects,
  getOrCreateNodeByHeadline,
} from './RealmQueries';
import {
  mapAgendaToPlainObject,
  mapFileToPlainObject,
  mapFilesToToc,
  mapNodeToPlainObject,
  mapNodeToSearchResult,
} from '../Transforms';

// ** Funcs

export const mapNodesToPlainObject = nodes =>
  Array.from(nodes).map(mapNodeToPlainObject);
// Returns whole file content including nodes as plain object

// ** Queries

const getDescendants = (node, nodes) => {
  const lowerNodes = nodes
    .filtered(`position > "${node.position}"`)
    .sorted('position');
  return R.pipe(R.takeWhile(n => n.level > node.level))(lowerNodes);
};

const getAncestors = (node, nodes) => {
  const upperNodes = nodes
    .filtered(`position < "${node.position}"`)
    .sorted('position');
  return R.pipe(
    R.reverse,
    R.reduce(
      (acc, node) => {
        const level = node.level;
        const lastLevel = R.last(acc).level;
        if (level < lastLevel) {
          acc.push(node);
          if (level === 1) return R.reduced(acc);
        }
        return acc;
      },
      [node]
    ),
    R.drop(1),
    R.reverse
  )(upperNodes);
};

const getRelatedNodes = nodeId =>
  dbConn.then(realm => {
    const result = [];
    const node = getNodeById(realm, nodeId);
    const fileNodes = node.file.nodes;
    const ancestors = getAncestors(node, fileNodes);
    const descendants = getDescendants(node, fileNodes);

    return [
      ...mapNodesToPlainObject(ancestors),
      ...mapNodesToPlainObject([node]),
      ...mapNodesToPlainObject(descendants),
    ];
  });

const getAncestorsAsPlainObject = nodeId =>
  dbConn.then(realm => {
    const node = getNodeById(realm, nodeId);
    const ancestors = getAncestors(node, node.file.nodes);

    return [...mapNodesToPlainObject([...ancestors, node])];
  });

const getFileAsPlainObject = id =>
  dbConn.then(realm => {
    const f = realm.objects('OrgFile').filtered(`id = '${id}'`)[0];
    const filePlain = mapFileToPlainObject(f);
    return {
      fileData: filePlain,
      nodesList: mapNodesToPlainObject(f.nodes.sorted('position')),
    };
  });

// Return only files fields as plain object, without nodes
const getAllFilesAsPlainObject = () =>
  getFiles().then(files => files.map(mapFileToPlainObject));

const getTocs = () => getFiles().then(mapFilesToToc);
const getTagsAsPlainObject = () =>
  getObjects('OrgTag').then(tags => tags.map(tag => tag.name));

const addDay = (date, num) =>
  moment(date)
    .add(num, 'd')
    .format('YYYY-MM-DD');

const getOrCreateNodeByHeadlineAsPlainObject = async ({ fileId, headline }) => {
  const realm = await dbConn;
  const [node, created] = await getOrCreateNodeByHeadline(
    getFileById(realm, fileId),
    headline
  );
  return [mapNodeToSearchResult(node), created];
};
// ** Exports

const getAgendaAsPlainObject = async (
  { start, end },
  defaultWarningPeriod = 14
) => {
  // **** initialize

  const timestamps = await getObjects('OrgTimestamp');

  let nodes = [];
  let agendaItems;
  let dayAgendaItems;

  // **** TODO agenda

  agendaItems = mapAgendaToPlainObject(
    timestamps
      .sorted('date')
      .filtered('date > $0 && date < $1', addDay(start, -1), addDay(end, 1))
  );

  // **** TODO scheduled for today and before today and undone

  // const getTodayAgenda = () => null;

  // // console.tron.log(timestamps)
  const dayAgenda = {
    closed: timestamps.filtered(
      'date > $0 && date < $1 && type="closed"',
      moment()
        .hour(0)
        .minutes(0)
        .seconds(0)
        .millisecond(0)
        .toDate(),
      moment()
        .add(1, 'd')
        .hour(0)
        .minutes(0)
        .seconds(0)
        .millisecond(0)
        .toDate()
    ),
    deadlines: timestamps.filtered(
      'type = "deadline" && date => $0 && nodes.todo != "DONE"',
      moment()
        .add(-defaultWarningPeriod, 'd')
        .format('YYYY-MM-DD')
    ),
    scheduled: timestamps.filtered(
      'date < $0 && nodes.todo != "DONE" && type="scheduled"',
      // moment().format('YYYY-MM-DD') +
      moment()
        .add(1, 'd')
        .hour(0)
        .minutes(0)
        .seconds(0)
        .millisecond(0)
        .toDate()
    ),
  };
  // console.tron.log(R.map(R.length, dayAgenda))

  dayAgendaItems = Object.values(dayAgenda).reduce(
    (acc, item) => {
      const { nodes, timestamps } = mapAgendaToPlainObject(item);
      return R.evolve(
        {
          nodes: R.concat(nodes),
          timestamps: R.concat(timestamps),
        },
        acc
      );
    },
    {
      nodes: [],
      timestamps: [],
    }
  );
  // console.tron.warn(dayAgendaItems)

  // **** results

  nodes = R.unionWith(
    R.eqBy(R.prop('id')),
    agendaItems.nodes,
    dayAgendaItems.nodes
  );
  // console.tron.warn(nodes)
  // nodes = []

  const res = {
    nodes,
    agendaItems: agendaItems.timestamps,
    dayAgendaItems: dayAgendaItems.timestamps,
  };

  return res;
  // **** end
};

export default {
  getAgendaAsPlainObject,
  getRelatedNodes,
  getTocs,
  getTagsAsPlainObject,
  getAllFilesAsPlainObject,
  getFileAsPlainObject,
  getAncestorsAsPlainObject,
  getOrCreateNodeByHeadline: getOrCreateNodeByHeadlineAsPlainObject,
};
