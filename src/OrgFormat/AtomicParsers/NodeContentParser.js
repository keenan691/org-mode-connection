// * Imports

import R from "ramda";

import { hungryLineParser } from '../GenericParsers/HungryLineParser';
import { makeRegex } from '../../Helpers/Functions';
import {
  nodeContentInlineElementsR,
  nodeContentLinesR,
  nodeContentLinksR,
} from '../Regex';
import { rlog } from '../../Helpers/Debug';

// * Functions

const splitLines = R.split('\n');

const ireduce = R.addIndex(R.reduce);

const indexesOf = (string, regex) => {
  var match, indexes = [];
  const regexx = new RegExp(regex);
  while (match = regexx.exec(string)) {
    indexes.push(match.index)}
  return indexes}

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

const createParsers = (createParserFunction, parsersDescription) => R.pipe(
  R.toPairs, R.map(([name, val]) => createParserFunction(name, val))
)(parsersDescription)

// * Inline parsers
// ** Config

const spaceChars = [undefined, ' ', ',', '.', '!', ')', '('];

const orgTextFaces = {
  strikeThroughText: '+',
  boldText: '*',
  codeText: '~',
  underlineText: '_',
  verbatimText: '=',
  italicText: '/'
}

const isTextFaceStart = R.curry(
  (line, idx) => spaceChars.includes(line[idx-1]) && !spaceChars.includes(line[idx+1]))

const isTextFaceEnd = R.curry(
  (line, idx) => !spaceChars.includes(line[idx-1]) && spaceChars.includes(line[idx+1]))

// ** Font face parser

const createOrgTextFaceParser = (type, specialChar) => ([objects, line]) => {
  const findSpecialCharsIndexes = (line) => indexesOf(line, new RegExp("\\"+specialChar, 'g'));

  const getCharType = R.cond([
    [isTextFaceStart(line), R.always('s')],      // is section start
    [isTextFaceEnd(line), R.always('e')       // is section end
    ]]);

  const mapToObjects = R.map(([indexStart, indexEnd]) => ({
    type,
    indexStart,
    indexEnd: indexEnd + 1,
    content: line.slice(indexStart+1, indexEnd)}))

// console.log(specialChar)
  const parsedObjects = R.pipe(
    findSpecialCharsIndexes,
    R.map(idx => [idx, getCharType(idx)]),
    R.reject(R.pipe(R.last, R.equals(undefined))),
    R.reduce((acc, val) => {
      const currentType = val[1];
      const lastType = R.last(acc);
      if (lastType !== currentType) acc.push(val)
      return acc
    }, []),
    R.when(lst => lst.length > 0 && R.head(lst)[1] === 'e', R.drop(1)),
    R.when(lst => lst.length > 0 && R.last(lst)[1] === 's', R.dropLast(1)),
    R.map(R.head),
    R.splitEvery(2),
    mapToObjects,
    // R.tap(console.log),
  )(line)

  if (parsedObjects.length > 0) objects = R.concat(objects, parsedObjects)
  return [objects, line]
};

const textFacesParsers = createParsers(createOrgTextFaceParser, orgTextFaces);

// ** Links parser

const createLinkParser = (type, regex) => ([objects, line]) => {
  let result;
  while (result = regex.exec(line.trim())) {
    const {index, input}  = result
    const [orig, ...parsed] = result;
    // const [] = ;

    const obj = {
      indexStart: index,
      indexEnd: index + orig.length,
      type: `${type}Link`
    };

    switch (type) {
    case 'plain':
      obj.url = orig.trim()
      break
    default:
      obj.url = parsed[0]
      obj.title = parsed[1]
    }

    // const isLink = R.propSatisfies(R.test(/link/i), 'type');
    // const addTitle = R.merge({ title: parsed[1] });

    // const enhanceObj = R.pipe(
    //   R.when(isLink, addTitle))

    objects.push(obj)}
  return [objects, line]
}

const linksParsers = createParsers(createLinkParser, nodeContentLinksR)


// ** Regular text parser

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
    R.sortBy(R.prop('indexStart')),
    R.chain(obj => [obj.indexStart, obj.indexEnd]),
    addLastIndex,
    R.ifElse(beginsBySpecialBlock, R.pipe(R.drop(1)), safeAddFirstIndex),
    R.when(R.pipe(R.length, R.equals(1)), R.drop(1)),
    R.splitEvery(2),
    mapGroupsToObjects,
    R.tap(console.log),
    R.concat(objects),
    R.sortBy(R.prop('indexStart')),
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
    ...linksParsers,
    regularTextParser,
  )(innerRepr)}

export default R.pipe(
  splitLines,
  R.map(
    R.converge(
      R.call,
      [getLineCreator, parseLine])))
