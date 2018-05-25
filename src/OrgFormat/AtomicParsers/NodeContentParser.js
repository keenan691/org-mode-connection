import R from "ramda";

import { hungryLineParser } from '../GenericParsers/HungryLineParser';
import { makeRegex } from '../../Helpers/Functions';
import { nodeContentLinesR, nodeContentInlineElementsR } from '../Regex';
import { rlog } from '../../Helpers/Debug';

// * Functions

const splitLines = R.split('\n');
const ireduce = R.addIndex(R.reduce);

function indexesOf(string, regex) {
  var match, indexes = [];
  const regexx = new RegExp(regex);
  while (match = regexx.exec(string)) {
    indexes.push(match.index)}
  return indexes}

const measure = (text='perf: ', fun) => (...args) => {
  const start = Date.now();
  const res = fun(...args)
  const end = Date.now();
  console.log(text, end-start)
  return res}

export const createCreatorsFromRegex = (regexes) => {
  const addValue = (val, propName='value') => R.merge({ [propName]: val });
  const isCheckedCheckbox = R.propEq('type', 'checkedCheckboxLine');
  const isNotCheckedCheckbox = R.propEq('type', 'checkboxLine');

  const createLineObjects = R.mapObjIndexed((regexObj, key) => R.pipe(
    R.when(isCheckedCheckbox, addValue(true, 'checked')),
    R.when(isNotCheckedCheckbox, addValue(false, 'checked')))(
    { type: key }));

  const mapObjToCreators = R.map(
    (obj) => (content, additionalProps) =>
      R.merge(obj, {content, ...additionalProps}));

  return R.pipe(
    createLineObjects,
    mapObjToCreators
  )(regexes)
}

const beginsBySpecialBlock = R.pipe(R.head, R.equals(0));
const propOf = R.flip(R.prop);

const safeAddFirstIndex = R.unless(
  R.pipe(R.head, R.equals(0)),
  R.prepend(0))

// * Inline functional parser

// ** font face parser

const spaceChars = [undefined, ' ', ',', '.', '!', ')', '('];

const orgTextFaces = {
  strikeThroughText: '+',
  boldText: '*',
  codeText: '~',
  underlineText: '_',
  verbatimText: '=',
  italicText: '/'}

const isTextFaceStart = R.curry(
  (line, idx) => spaceChars.includes(line[idx-1]) && !spaceChars.includes(line[idx+1]))

const isTextFaceEnd = R.curry(
  (line, idx) => !spaceChars.includes(line[idx-1]) && spaceChars.includes(line[idx+1]))

const createOrgTextFaceParser = (name, specialChar) => ([objects, line]) => {
  const findSpecialCharsIndexes = (line) => indexesOf(line, new RegExp("\\"+specialChar, 'g'));

  const getCharType = R.cond([
    [isTextFaceStart(line), R.always('s')],
    [isTextFaceEnd(line), R.always('e')]]);

  const mapToObjects = R.map(([indexStart, indexEnd]) => ({
    type: name,
    content: line.slice(indexStart+1, indexEnd),
    indexStart,
    indexEnd: indexEnd + 1}))

  const parsedObjects = R.pipe(
    findSpecialCharsIndexes,
    R.map(idx => [idx, getCharType(idx)]),
    R.reject(R.pipe(R.last, R.equals(undefined))),
    R.map(R.head),
    R.splitEvery(2),
    mapToObjects
  )(line)

  if (parsedObjects.length > 0) objects = R.concat(objects, parsedObjects)
  return [objects, line]
};

const textFacesParsers = R.pipe(
  R.toPairs, R.map(([name, char]) => createOrgTextFaceParser(name, char))
)(orgTextFaces)


// const inlineParserCreator = (regex, creator) => ([objects, line]) => {
//   let result;
//   while (result = regex.exec(line)) {
//     const {index, input}  = result
//     const [orig, ...parsed] = result;

//     const obj = creator(parsed[0], {
//       indexStart: index,
//       indexEnd: index + orig.length
//     });

//     const isLink = R.propSatisfies(R.test(/link/i), 'type');
//     const addTitle = R.merge({ title: parsed[1] });

//     const enhanceObj = R.pipe(
//       R.when(isLink, addTitle))

//     objects.push(enhanceObj(obj))}
//   return [objects, line]
// };

// ** regular text parser

const regularTextParser = ([objects, line]) => {
  const addLastIndex = R.unless(
    R.pipe(R.last, R.equals(line.length)),
    R.append(line.length))

  const mapGroupsToObjects = R.map(([indexStart, indexEnd]) => ({
    content: line.slice(indexStart, indexEnd),
    type: 'regularText',
    indexStart,
    indexEnd}))

  const newObjects = R.pipe(
    R.chain(obj => [obj.indexStart, obj.indexEnd]),
    addLastIndex,
    R.ifElse(beginsBySpecialBlock, R.pipe(R.drop(1)), safeAddFirstIndex),
    R.when(R.pipe(R.length, R.equals(1)), R.drop(1)),
    R.splitEvery(2),
    mapGroupsToObjects,
    R.concat(objects),
    R.sortBy(R.prop('indexStart'))
  )(objects)

  return newObjects
};

// * Line creators

export const regexLineCreators = createCreatorsFromRegex(nodeContentLinesR);

export const regularLineCreator = (content) => ({
  type: 'regularLine',
  content});

const getLineCreator = (
  line,
  regexObj=nodeContentLinesR,
  creators=regexLineCreators ,
  defaultCreator=regularLineCreator) =>
      R.reduceWhile(
        (acc, x) => acc !== x,
        (acc, x) => regexObj[x].test(line) ? creators[x] : acc,
        defaultCreator,
        R.keys(creators));

// * Parser

const parseLine = (line) => {
  const innerRepr = [[], line];
  return R.pipe(
    ...textFacesParsers,
    regularTextParser,
  )(innerRepr)}

export default R.pipe(
  splitLines,
  R.map(
    R.converge(
      R.call,
      [getLineCreator, parseLine])))
