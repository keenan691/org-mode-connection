import R from "ramda";
import { hungryLineParser } from '../GenericParsers/HungryLineParser';
import { nodeContentLinesR, nodeContentInlineElementsR } from '../Regex';

const treis = require('treis');

// * Lines  and Elements creators

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

export const regexLineCreators = createCreatorsFromRegex(nodeContentLinesR);
export const regularLineCreator = (content) => ({
  type: 'regularLine',
  content
});

export const inlineElementsCreators = createCreatorsFromRegex(nodeContentInlineElementsR);
export const regularTextCreator = (content) => ({
  type: 'regularText',
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


// * Parse content line

const getContent = R.prop('content')
const splitLines = R.split('\n');

const log = (obj) => {
  console.log(obj)
  return obj}

// * Inline parseLine

const createInlineParsers = () => [
  hungryLineParser(nodeContentInlineElementsR.boldText,
                   inlineElementsCreators, 'lines')];

const parseRegularLine = ([objects, line]) => {
  objects.push(regularTextCreator(line))
  return objects}

const parseLine = (line) => {
  const innerRepr = [[], line];
  return R.pipe(
    parseRegularLine)(innerRepr)}

// * Parser

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
