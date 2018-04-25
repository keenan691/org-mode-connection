import R from "ramda";

import {
  mapNodeContentToObject,
  regexLineCreators,
  regularLineCreator,
} from '../../../src/OrgFormat/AtomicParsers/NodeContentParser';

// * Factory functions

// ** Test

const testNodesMappings = (mappingResults, mappedProp, extractPath) =>
      Object.keys(mappingResults).forEach(
        (key) => {
          const node = createNode({ [mappedProp]: mappingResults[key][0] });
          const nodeMappingResult = mapNodeContentToObject(node);
          const extractedPath = R.path(extractPath, nodeMappingResult);
          const expectation = mappingResults[key][1];
          expect(extractedPath).toMatchObject(expectation)})

// ** Node

const createNode = (props) => ({
  headline: 'This is headline ',
  content: '',
  ...props
})

// ** Inline elements

const link = (url, urlTitle) => ({
  type: 'link',
  url,
  urlTitle});

const regularText = (t) => ({
  type: 'regularText',
  indexStart: expect.any(Number),
  indexEnd: expect.any(Number),
  content: t});

const codeText = (t) => ({
  type: 'codeText',
  content: t});

const strikeThroughText = (t) => ({
  type: 'strikeThroughText',
  content: t});

const underlineTextCreator = (t) => ({
  type: 'underlineText',
  content: t});

const verbatimTextCreator = (t) => ({
  type: 'verbatimText',
  content: t});

const boldTextCreator = (t) => ({
  type: 'boldText',
  content: t});

const italicTextCreator = (t) => ({
  type: 'italicText',
  content: t});

// ** Line containers

// * Test data

// ** Line types

const contentLinesMappings = {

  emptyLine: [
    '\n',
    [regularLineCreator(
      []),
     regularLineCreator(
       [])]],

  regularLine: [
    'Suspendisse potenti.  ',
    [regularLineCreator(
      [regularText('Suspendisse potenti.  ')])]],

  twoLines: [
    'one\ntwo',
    [regularLineCreator([regularText('one')]),
     regularLineCreator([regularText('two')])]],

  listLine: [
    '- Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    [regexLineCreators.listLine(
      [regularText('- Lorem ipsum dolor sit amet, consectetuer adipiscing elit.')])]],

  checkboxLine: [
    '- [ ] Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    [regexLineCreators.checkboxLine(
      [regularText('- [ ] Lorem ipsum dolor sit amet, consectetuer adipiscing elit.')])]],

  checkboxLineWithBold: [
    '- [ ] *Lorem* ipsum dolor sit amet, consectetuer adipiscing elit.',
    [regexLineCreators.checkboxLine(
      [regularText('- [ ] '),
       boldTextCreator('Lorem'),
       regularText(' ipsum dolor sit amet, consectetuer adipiscing elit.')],
      false)]],

  numericListLine: [
    '1. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    [regexLineCreators.numericListLine(
      [regularText('1. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.')])]]};

// ** Links

const links = {
  unknown: {
    url: 'https://reactnavigation.org/docs/drawer-navigator.html ',
    urlTitle: 'DrawerNavigator reference · React Navigation]]'}};

const linksMappings = {
  generic: ' [[https://reactnavigation.org/docs/drawer-navigator.html][DrawerNavigator reference · React Navigation]]',
  web: ' [[https://reactnavigation.org/docs/drawer-navigator.html][DrawerNavigator reference · React Navigation]]',
  mail: ' [[https://reactnavigation.org/docs/drawer-navigator.html][DrawerNavigator reference · React Navigation]]'};

// ** Headers

const headerMappings = {

  regular: [
    'Nulla posuere.',
    [regularLineCreator(
      [regularText('Nulla posuere.')])]],

  // withLink: [
  //   `Nulla posuere. ${link(...links.unknown)} Proin neque massa`,
  //   [regularLineCreator([
  //     regularText('Nulla posuere.'),
  //     link(...links.unknown)])]]

};

// ** Faces

const regularLinesWithFacesMappings = {

  strikeThroughLine: [
    'Proin quam nisl, +tincidunt+ et, mattis eget, +convallis+ nec, purus.  ',
    [regularLineCreator(
      [regularText('Proin quam nisl, '),
       strikeThroughText('tincidunt'),
       regularText(' et, mattis eget, '),
       strikeThroughText('convallis'),
       regularText(' nec, purus.  ')])]],

  underlineLine: [
    'Nunc aliquet, augue _nec_ adipiscing interdum, lacus tellus malesuada massa, quis varius mi purus non odio.  ',
    [regularLineCreator(
      [regularText('Nunc aliquet, augue ') ,
       underlineTextCreator('nec') ,
       regularText(' adipiscing interdum, lacus tellus malesuada massa, quis varius mi purus non odio.  ')])]],

  boldLine: [
    'Fusce sagittis, libero non molestie mollis, *magna* orci ultrices dolor, at *vulputate* neque nulla *lacinia* eros.  ',
    [regularLineCreator(
      [regularText('Fusce sagittis, libero non molestie mollis, ') ,
       boldTextCreator('magna') ,
       regularText(' orci ultrices dolor, at ') ,
       boldTextCreator('vulputate') ,
       regularText(' neque nulla ') ,
       boldTextCreator('lacinia') ,
       regularText(' eros.  ')])]],

  codeLine: [
    '~convallis~',
    [regularLineCreator(
      [codeText('convallis')])]],

  verbatimLine: [
    '=Integer=',
    [regularLineCreator(
      [verbatimTextCreator('Integer')])]],

  italicLine: [
    '/bibendum/',
    [regularLineCreator(
      [italicTextCreator('bibendum')])]]}

// * Tests

describe("mapsNodeContentToObject", () => {

  test.only("mappings lines to text objects", () => {
    testNodesMappings(regularLinesWithFacesMappings, 'content', ['objectContent'])});

  test.only("maps content lines to line objects", () => {
    testNodesMappings(contentLinesMappings, 'content', ['objectContent'])});
})
