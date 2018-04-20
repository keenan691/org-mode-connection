import R from "ramda";

import { mapNodeContentToObject } from '../../src/Data/Transforms';

// * Input data

// ** Data creators

const createNode = (props) => ({
  headline: 'This is headline ',
  content: ''
  // ...props
})

// ** Data elements

const elements = {
  links: {
    webLine: ' [[https://reactnavigation.org/docs/drawer-navigator.html][DrawerNavigator reference · React Navigation]]',
    mailLine: ' [[https://reactnavigation.org/docs/drawer-navigator.html][DrawerNavigator reference · React Navigation]]',
    unknownLine: ' [[https://reactnavigation.org/docs/drawer-navigator.html][DrawerNavigator reference · React Navigation]]'},
  lines: {
    emptyLine: '\n',
    listLine: '- Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    checkboxLine: '- [ ] Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    checkboxLineWithBold: '- [ ] *Lorem* ipsum dolor sit amet, consectetuer adipiscing elit.',
    numericListLine: '1. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    regularLine: 'Suspendisse potenti.  ',
    strikeThroughLine: 'Proin quam nisl, +tincidunt+ et, mattis eget, convallis nec, purus.  ',
    underlineLine: 'Nunc aliquet, augue _nec_ adipiscing interdum, lacus tellus malesuada massa, quis varius mi purus non odio.  ',
    verbatimLine: '=Integer= placerat tristique nisl.  ',
    boldLine: 'Fusce sagittis, libero non molestie mollis, *magna* orci ultrices dolor, at *vulputate* neque nulla *lacinia* eros.  ',
    italicLine: 'Sed /bibendum/.  ',
    codeLine: 'Vestibulum ~convallis~, lorem a tempus semper, dui dui euismod elit, vitae placerat urna tortor vitae lacus.  ',},}

// * Output data

// ** Elements creators

// *** Inline elements

const regularTextCreator = (t) => {
  type: 'regular',
  text: t};

const strikeThroughTextCreator = (t) => {
  type: 'strikeThrough',
  text: `+${t}+`};

const underlineTextCreator = (t) => {
  type: 'underline',
  text: `_${t}_`};

const verbatimTextCreator = (t) => {
  type: 'verbatim',
  text: `=${t}=`};

const boldTextCreator = (t) => {
  type: 'bold',
  text: `*${t}*`};

const italicTextCreator = (t) => {
  type: 'italic',
  text: `/${t}/`};

// *** Line containers

const regularLine = (elements) => {
  type: 'regular'
  elements};

const listLine = (elements) => {
  type: 'list'
  elements};

const checkboxLine = (elements) => {
  type: 'checkbox'
  elements};

const numericListLine = (elements) => {
  type: 'numericList'
  elements};

// * Tests

describe("mapNodeContentToObject", () => {
  test.only("parsing regular simple node", () => {
    const testData = createNode();
    const expectation = {
      [[]]
    };
    expect(mapNodeContentToObject(testData).plainContent).toBe(testData)
    expect(mapNodeContentToObject(testData).objectContent).toEqual(testData)
  });

})
