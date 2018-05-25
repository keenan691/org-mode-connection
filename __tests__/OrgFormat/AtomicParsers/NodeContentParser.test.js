import R from "ramda";

import parseOrgNodeContent, {
  regexLineCreators,
  regularLineCreator,
} from '../../../src/OrgFormat/AtomicParsers/NodeContentParser';

// * Factory functions

// ** Test

const testLines = (mappingResults, mappedProp, extractPath) =>
      Object.keys(mappingResults).forEach(
        (key) => {
          const node = createNode({ [mappedProp]: mappingResults[key][0] });
          const result = parseOrgNodeContent(node.content);
          const expectation = mappingResults[key][1];
          expect(result).toMatchObject(expectation)})

// ** Node

const createNode = (props) => ({
  headline: 'This is headline ',
  content: '',
  ...props
})

// ** Inline elements

const createLink = (type, url, urlTitle) => ({
  type: `${type}Link`,
  title: expect.any(String),
  url
});

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

const contentLinesTests = {

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
    '- [ ] df(*Lorem* ipsum dolor sit amet, consectetuer adipiscing elit.',
    [regexLineCreators.checkboxLine(
      [regularText('- [ ] df('),
       boldTextCreator('Lorem'),
       regularText(' ipsum dolor sit amet, consectetuer adipiscing elit.')],
      false)]],

  numericListLine: [
    '1. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    [regexLineCreators.numericListLine(
      [regularText('1. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.')])]],

};

// ** Links

const links = {
  unknown: {
    url: 'https://reactnavigation.org/docs/drawer-navigator.html ',
    urlTitle: 'DrawerNavigator reference · React Navigation]]'}};

const createLinkTest = (type, url, title) => ([
  `Suspendisse potenti. [[${url}][${title}]].`,
  [regularLineCreator(
    [regularText('Suspendisse potenti. '), createLink(type, url, title)])]
])

const linesWithLinksTests = {
  simpleWebLink: createLinkTest('web', 'https://wp.pl', 'WP'),
};

// ** Faces

const regularLinesWithFacesTests = {

  verbatimLine: [
    '=Integer=with spaces and= and =second= d=d',
    [regularLineCreator(
      [
        verbatimTextCreator('Integer=with spaces and'),
        regularText(' and '),
        verbatimTextCreator('second'),
        regularText(' d=d'),
      ])]],

  strikeThroughLine: [
    'proin quam nisl, +tincidunt+ et, mattis eget, +convallis+ nec, purus.  ',
    [regularLineCreator(
      [regularText('proin quam nisl, '),
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

  italicLine: [
    '/bibendum/',
    [regularLineCreator(
      [italicTextCreator('bibendum')])]]}

// * Tests

describe("mapsNodeContentToObject", () => {

  test.only("mapping lines with links to text objects", () => {
    testLines(linesWithLinksTests, 'content', ['objectContent'])});

  test("mapping lines to text objects", () => {
    testLines(regularLinesWithFacesTests, 'content', ['objectContent'])});

  test("maping content lines to line objects", () => {
    testLines(contentLinesTests, 'content', ['objectContent'])});
})
