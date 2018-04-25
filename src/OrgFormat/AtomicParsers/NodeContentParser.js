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

const inlineParser = (regex, creator) => ([objects, line]) => {
  let result;
  while (result = regex.exec(line)) {
    // console.log(result)
    const {index, input}  = result

    const [orig, ...parsed] = result;
    // console.log("parsed = ", parsed);

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
const createParserFromProp = R.converge(
  inlineParser, [propOf(nodeContentInlineElementsR), propOf(regexTextCreators)]);
const specialTextParsers = R.map(createParserFromProp, R.keys(regexTextCreators))

const regularTextParser = ([objects, line]) => {
  const mapOfLine = R.range(0, line.length)

  // mark objects on map
  objects.forEach((obj) => {
    const objShadow = R.range(obj.indexStart, obj.indexEnd);
    objShadow.forEach((val) => mapOfLine[val] = null)})

  const makeGroups = R.groupWith(R.eqBy(R.type))
  const filterByRegularTextGroups = R.filter(R.pipe(R.head, R.complement(R.equals(null))));

  const mapGroupToText = R.pipe(
    R.map((idx) => line[idx]),
    R.join(''))

  const mapGroupsToObjects = R.map(
    R.converge(regularTextCreator,
               [mapGroupToText, R.applySpec({
                 indexStart: R.head,
                 indexEnd: R.last})]));

  const mergeInputObjects = R.concat(objects);
  const sortByInlinePosition = R.sortBy(R.prop('indexStart'))

  return R.pipe(
    makeGroups,
    filterByRegularTextGroups,
    mapGroupsToObjects,
    mergeInputObjects,
    sortByInlinePosition
  )(mapOfLine)
}

const parseLine = (line) => {
  const innerRepr = [[], line];
  return R.pipe(
    ...specialTextParsers,
    regularTextParser
  )(innerRepr)}

// * Prepare content

const getContent = R.prop('content')
const splitLines = R.split('\n');
const prepareContent = R.pipe(getContent,
                              splitLines)
// * Parse

const parseContent = R.pipe(
  prepareContent,
  R.map(
    R.converge(
      R.call,
      [getLineCreator, parseLine])))

export const mapNodeContentToObject = R.applySpec({
  plainContent: getContent,
  objectContent: parseContent})
