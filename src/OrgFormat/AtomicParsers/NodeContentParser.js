import R from "ramda";

import { hungryLineParser } from '../GenericParsers/HungryLineParser';
import { nodeContentLinesR, nodeContentInlineElementsR } from '../Regex';
import { rlog } from '../../Helpers/Debug';

const treis = require('treis');


// * Fabrics

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

const inlineParser = (regex, creator) => ([objects, line]) => {
  let result;
  while (result = regex.exec(line)) {
    const {index, input}  = result
    const [orig, parsed] = result;
    const obj = creator(parsed, {
      indexStart: index,
      indexEnd: index + orig.length
    });
    objects.push(obj)}
  return [objects, line]
};

// * Creators

// ** Line creators

export const regexLineCreators = createCreatorsFromRegex(nodeContentLinesR);

export const regularLineCreator = (content) => ({
  type: 'regularLine',
  content
});

const getLineCreator = (line,
                        regexObj=nodeContentLinesR,
                        creators=regexLineCreators ,
                        defaultCreator=regularLineCreator) =>
      R.reduceWhile(
        (acc, x) => acc !== x,
        (acc, x) => regexObj[x].test(line) ? creators[x] : acc,
        defaultCreator,
        R.keys(creators));

// ** Inline creators

export const inlineElementsCreators = createCreatorsFromRegex(nodeContentInlineElementsR);

export const regularTextCreator = (content, params) => ({
  type: 'regularText',
  content,
  ...params
});


// * Parse line

// TODO
const createInlineParsers = () => [
  inlineParser(nodeContentInlineElementsR.boldText,
               inlineElementsCreators.boldText)];

const inlineParsers = createInlineParsers();

const parseRegularLines = ([objects, line]) => {
  const lineMap = R.range(0, line.length)

  // Mark objects on map
  objects.forEach((obj) => {
    const objShadow = R.range(obj.indexStart, obj.indexEnd);
    objShadow.forEach((val) => lineMap[val] = null)})

  const mapGroupToText = R.pipe(
    R.map((idx) => line[idx]),
    R.join(''))

  const mapGroupsToObjects = R.map(
    R.converge(regularTextCreator,
               [mapGroupToText, R.applySpec({
                 indexStart: R.head,
                 indexEnd: R.last})]));

  const filterByRegularTextGroups = R.filter(R.pipe(R.head, R.complement(R.equals(null))));
  const sortByPlacement = R.sortBy(R.prop('indexStart'))
  // Extract regular text ranges from lineMap
  const makeGroups = R.groupWith(R.eqBy(R.type))

  const mergeObjects = R.concat(objects);

  return R.pipe(
    makeGroups,
    filterByRegularTextGroups,
    mapGroupsToObjects,
    mergeObjects,
    sortByPlacement
  )(lineMap)
}

const parseLine = (line) => {
  const innerRepr = [[], line];
  return R.pipe(
    inlineParsers[0],
    treis(parseRegularLines)
  )(innerRepr)}

// * Parser

const getContent = R.prop('content')
const splitLines = R.split('\n');
const prepareContent = R.pipe(getContent,
                              splitLines)

const parseContent = R.pipe(
  prepareContent,
  R.map(
    R.converge(
      R.call,
      [getLineCreator, parseLine])))

export const mapNodeContentToObject = R.applySpec({
  plainContent: getContent,
  objectContent: parseContent})
