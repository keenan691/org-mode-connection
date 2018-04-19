/** @flow */

import R from "ramda";
import { rlog } from '../../Helpers/Debug';
import { headlineR } from '../Regex';
import { headlineT } from '../Transforms';
import { lazyInLineParser } from '../GenericParsers/LazyInLineParser';

const parseLevel = lazyInLineParser(
  headlineR.head,
  headlineT.level.fromOrg);

const parseTodo = lazyInLineParser(
  headlineR.todo,
  headlineT.todo.fromOrg);

const parseTags = lazyInLineParser(
  headlineR.tags,
  headlineT.tags.fromOrg);

const parsePriority = lazyInLineParser(
  headlineR.priority,
  headlineT.priority.fromOrg);

const useRestAsPropAndRemoveInput = (propName) => (input) =>
      R.append({ [propName]: input[1][0].trim() }, input[0]);

export const parseHeadline = (line) => R.pipe(
  parseLevel,
  parseTodo,
  parsePriority,
  parseTags,
  useRestAsPropAndRemoveInput('headline'),
  R.mergeAll) ([[], [line]]);

export const preParseHeadline = (line) => R.pipe(
  parseLevel,
  useRestAsPropAndRemoveInput('rawHeadline'),
  R.mergeAll) ([[], [line]]);
