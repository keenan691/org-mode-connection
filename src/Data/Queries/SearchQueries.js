// * SearchQueries
// ** Imports

import R from 'ramda';

import { getObjects } from './Helpers';
import { mapNodeToSearchResult } from '../Transforms';

// ** Funcs

const mapNodesToSearchResults = nodes =>
  Array.from(nodes).map(mapNodeToSearchResult);

const removeNeutralFilters = R.reject(R.equals(0));
const prepareSearchQueries = (fieldName, filter) =>
  R.pipe(
    R.partition(R.equals(1)), // Partition to positive and negative filters
    R.converge(Array, [
      R.pipe(
        R.head,
        R.keys,
        R.map(value => `${fieldName} = "${value}"`),
        R.join(' || ')
      ),
      R.pipe(
        R.last,
        R.keys,
        R.map(value => `${fieldName} = "${value}"`),
        R.join(' || '),
        R.when(R.complement(R.isEmpty), x => `NOT (${x})`)
      ),
    ])
  )(filter);

// ** Queries

const search = ({
  searchTerm,
  todos,
  tags,
  priority,
  isScheduled,
  hasDeadline,
}) =>
  getObjects('OrgNode').then(nodes => {
    let filteredNodes = nodes;
    priority = removeNeutralFilters(priority);
    todos = removeNeutralFilters(todos);
    tags = removeNeutralFilters(tags);

    if (searchTerm) {
      filteredNodes = filteredNodes.filtered(
        'headline CONTAINS[c] $0 || content CONTAINS[c] $0',
        searchTerm
      );
    }

    if (isScheduled) {
      filteredNodes = filteredNodes.filtered('timestamps.type = "scheduled"');
    }

    if (hasDeadline) {
      filteredNodes = filteredNodes.filtered('timestamps.type = "deadline"');
    }

    if (!R.isEmpty(todos)) {
      const [positiveQuery, negativeQuery] = prepareSearchQueries(
        'todo',
        todos
      );
      const query = positiveQuery || negativeQuery;
      filteredNodes = filteredNodes.filtered('todo != null');
      filteredNodes = filteredNodes.filtered(query);
    }

    if (!R.isEmpty(priority)) {
      const [positiveQuery, negativeQuery] = prepareSearchQueries(
        'priority',
        priority
      );
      const query = positiveQuery || negativeQuery;
      filteredNodes = filteredNodes.filtered('priority != null');
      filteredNodes = filteredNodes.filtered(query);
    }

    if (!R.isEmpty(tags)) {
      const [positiveQuery, negativeQuery] = prepareSearchQueries(
        'tags.name',
        tags
      );

      if (!positiveQuery && R.isEmpty(todos)) {
        filteredNodes = filteredNodes.filtered('tags.@size > 0');
      }

      const query = R.pipe(R.reject(R.isEmpty), R.join(' AND '))([
        positiveQuery,
        negativeQuery,
      ]);
      filteredNodes = filteredNodes.filtered(query);
    }

    // In case if non of filters was applied return empty result
    if (filteredNodes === nodes) {
      return [];
    }

    return mapNodesToSearchResults(filteredNodes.sorted('file.id'));
  });

// ** Exports

export default {
  search,
};
