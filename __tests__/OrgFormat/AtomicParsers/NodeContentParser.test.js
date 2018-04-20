import R from "ramda";

import {
  lineCreators,
  mapNodeContentToObject,
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
          expect(extractedPath).toEqual(expectation)})

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
  type: 'regular',
  text: t});

const codeText = (t) => ({
  type: 'code',
  text: t});

const strikeThroughText = (t) => ({
  type: 'strikeThrough',
  text: t});

const underlineTextCreator = (t) => ({
  type: 'underline',
  text: t});

const verbatimTextCreator = (t) => ({
  type: 'verbatim',
  text: t});

const boldTextCreator = (t) => ({
  type: 'bold',
  text: t});

const italicTextCreator = (t) => ({
  type: 'italic',
  text: t});

// ** Line containers

// * Test data

// ** Line types

const contentLinesMappings = {

  emptyLine: [
    '\n',
    [lineCreators.emptyLine(), lineCreators.emptyLine()]],

  regularLine: [
    'Suspendisse potenti.  ',
    [lineCreators.regularLine(
      [regularText('Suspendisse potenti.  ')])]],

  twoLines: [
    'one\ntwo',
    [lineCreators.regularLine([regularText('one')]),
     lineCreators.regularLine([regularText('two')])]],

  listLine: [
    '- Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    [lineCreators.listLine(
      [regularText('Lorem ipsum dolor sit amet, consectetuer adipiscing elit.')])]],

  checkboxLine: [
    '- [ ] Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    [lineCreators.checkboxLine(
      [regularText('Lorem ipsum dolor sit amet, consectetuer adipiscing elit.')])]],

  checkboxLineWithBold: [
    '- [ ] *Lorem* ipsum dolor sit amet, consectetuer adipiscing elit.',
    [lineCreators.checkboxLine(
      [boldTextCreator('Lorem'),
       regularText('ipsum dolor sit amet, consectetuer adipiscing elit.')],
      false)]],

  numericListLine: [
    '1. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    [lineCreators.numericListLine(
      [regularText('Lorem ipsum dolor sit amet, consectetuer adipiscing elit.')])]]};

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
    [lineCreators.regularLine(
      [regularText('Nulla posuere.')])]],

  // withLink: [
  //   `Nulla posuere. ${link(...links.unknown)} Proin neque massa`,
  //   [lineCreators.regularLine([
  //     regularText('Nulla posuere.'),
  //     link(...links.unknown)])]]

};

// ** Faces

const regularLinesWithFacesMappings = {

  strikeThroughLine: [
    'Proin quam nisl, +tincidunt+ et, mattis eget, +convallis+ nec, purus.  ',
    [lineCreators.regularLine(
      [regularText('Proin quam nisl, '),
       strikeThroughText('tincidunt'),
       regularText(' et, mattis eget, '),
       strikeThroughText('convallis'),
       regularText(' nec, purus.  ')])]],

  underlineLine: [
    'Nunc aliquet, augue _nec_ adipiscing interdum, lacus tellus malesuada massa, quis varius mi purus non odio.  ',
    [lineCreators.regularLine(
      [regularText('Nunc aliquet, augue') ,
       underlineTextCreator('nec') ,
       regularText(' adipiscing interdum, lacus tellus malesuada massa, quis varius mi purus non odio.  ')])]],

  boldLine: [
    'Fusce sagittis, libero non molestie mollis, *magna* orci ultrices dolor, at *vulputate* neque nulla *lacinia* eros.  ',
    [lineCreators.regularLine(
      [regularText('Fusce sagittis, libero non molestie mollis,') ,
       boldTextCreator('magna') ,
       regularText('orci ultrices dolor, at') ,
       boldTextCreator('vulputate') ,
       regularText('neque nulla') ,
       boldTextCreator('lacinia') ,
       regularText('eros.')])]],

  codeLine: [
    '~convallis~',
    [lineCreators.regularLine(
      [codeText('convallis')])]],

  verbatimLine: [
    '=Integer=',
    [lineCreators.regularLine(
      [verbatimTextCreator('Integer')])]],

  italicLine: [
    '/bibendum/',
    [lineCreators.regularLine(
      [italicTextCreator('bibendum')])]]}

// * Tests

describe("mapsNodeContentToObject", () => {

  test.only("returns input object in plainContent prop", () => {
    const node = createNode();
    const expectation = node;
    expect(mapNodeContentToObject(node).plainContent).toBe(expectation)});

  test.only("maps content lines to line objects", () => {
    testNodesMappings(contentLinesMappings, 'content', ['objectContent'])});
})
