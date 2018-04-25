import R from "ramda";

import { hungryLineParser } from '../GenericParsers/HungryLineParser';
import { nodeContentLinesR, nodeContentInlineElementsR } from '../Regex';
import { rlog } from '../../Helpers/Debug';

const treis = require('treis');

// * Functions

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

const inlineParserCreator = (regex, creator) => ([objects, line]) => {
  let result;
  while (result = regex.exec(line)) {
    const {index, input}  = result
    const [orig, ...parsed] = result;

    const obj = creator(parsed[0], {
      indexStart: index,
      indexEnd: index + orig.length
    });

    const isLink = R.propSatisfies(R.test(/link/i), 'type');
    const addTitle = R.merge({ title: parsed[1] });

    const enhanceObj = R.pipe(
      R.when(isLink, addTitle)
    );

    objects.push(enhanceObj(obj))}
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

export const regularTextCreator = (content, params) => ({
  type: 'regularText',
  content,
  ...params
});

export const regexTextCreators = createCreatorsFromRegex(nodeContentInlineElementsR);

// * Parse line

const propOf = R.flip(R.prop);
const createParserFromKey = R.converge(
  inlineParserCreator, [propOf(nodeContentInlineElementsR), propOf(regexTextCreators)]);
const specialTextParsers = R.map(createParserFromKey, R.keys(regexTextCreators))

// creates regularText objects from rest of line
const regularTextParser = ([parsedObjects, line]) => {
  const regularTextMap = R.range(0, line.length)
  parsedObjects.forEach((obj) => {
    const objShadow = R.range(obj.indexStart, obj.indexEnd);
    objShadow.forEach((val) => regularTextMap[val] = null)
  })

  const makeGroups = R.groupWith(R.eqBy(R.type))
  const filterOutShadowedGroups = R.filter(R.pipe(R.head, R.complement(R.equals(null))));

  const mapGroupToText = R.pipe(
    R.map((idx) => line[idx]),
    R.join(''))

  const mapGroupsToObjects = R.map(
    R.converge(regularTextCreator,
               [mapGroupToText, R.applySpec({
                 indexStart: R.head,
                 indexEnd: R.last})]));

  const mergeInputObjects = R.concat(parsedObjects);
  const sortByInlinePosition = R.sortBy(R.prop('indexStart'))

  return R.pipe(
    makeGroups,
    filterOutShadowedGroups,
    mapGroupsToObjects,
    mergeInputObjects,
    sortByInlinePosition
  )(regularTextMap)
}

const parseLine = (line) => {
  const innerRepr = [[], line];
  return R.pipe(
    ...specialTextParsers,
    regularTextParser
  )(innerRepr)}

// * Parse

const splitLines = R.split('\n');

export default R.pipe(
  splitLines,
  R.map(
    R.converge(
      R.call,
      [getLineCreator, parseLine])))
