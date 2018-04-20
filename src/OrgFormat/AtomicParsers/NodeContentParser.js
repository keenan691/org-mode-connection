import { nodeContentLinesR } from '../Regex';

/** @flow */

import R from "ramda";

import { hungryLineParser } from '../GenericParsers/HungryLineParser';
import { nodeContentInlineElementsR } from '../Regex';

export const parseContent = (lines) => ({
  content: lines
});

// * Content to object transform
// Traktować wszystkie linie tak samo. Nie gupować.
// Stowrzyć drugi array z liniami zawierający wartości odpowiadające
// Może coś zlinked list jest narzeczy

// ** Inline elements

const inlineElementsCreators = {

  link: (url, urlTitle) => ({
    type: 'link',
    url,
    urlTitle}),

  regularText: (t) => ({
    type: 'regular',
    text: t}),

  codeText: (t) => ({
    type: 'code',
    text: t}),

  strikeThroughText: (t) => ({
    type: 'strikeThrough',
    text: t}),

  underlineTextCreator: (t) => ({
    type: 'underline',
    text: t}),

  verbatimTextCreator: (t) => ({
    type: 'verbatim',
    text: t}),

  boldTextCreator: (t) => ({
    type: 'bold',
    text: t}),

  italicTextCreator: (t) => ({
    type: 'italic',
    text: t}),

}

// ** Line containers

export const lineCreators = {

  emptyLine: () => ({
    type: 'emptyLine'}),

  regularLine: (elements) => ({
    type: 'regularLine',
    elements}),

  listLine: (elements) => ({
    type: 'listLine',
    elements}),

  checkboxLine: (elements, value=false) => ({
    type: 'checkboxLine',
    value,
    elements}),

  numericListLine: (elements) => ({
    type: 'numericListLine',
    elements}),

}

// ** Parse content line

const getContent = R.prop('content')
const splitLines = R.split('\n');

const log = (obj) => {
  console.log(obj)
  return obj}

const getLineCreator = (line) => R.reduce(
  (acc, key) =>
    R.test(nodeContentLinesR[key], line) ?
    R.reduced(lineCreators[key]) : acc,
  lineCreators.regularLine,
  Object.keys(nodeContentLinesR))

const createInlineParsers = () => [
  hungryLineParser(nodeContentInlineElementsR.boldText,
                   inlineElementsCreators, 'lines')];

const makeRegularTextObjects = ([objects, line]) => {
  objects.push(inlineElementsCreators.regularText(line))
  return objects}

const parseLine = (line) => {
  const innerRepr = [[], line];
  return R.pipe(
    // ...createInlineParsers(),
    makeRegularTextObjects
  )(innerRepr)}

const mapContent = R.pipe(
  getContent,
  splitLines,
  R.tap(console.log),
  R.map(R.converge(R.call, [getLineCreator, parseLine])))

export const mapNodeContentToObject = R.applySpec({
  plainContent: getContent,
  objectContent: mapContent})
