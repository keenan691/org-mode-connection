// * TransformTest starts here

import R from "ramda";
import { mapNodeContentToObject } from '../../src/Data/Transforms';

// * Factory functions

// ** Node

const createNode = (props) => ({
  headline: 'This is headline ',
  content: ''
  // ...props
})

// ** Inline elements

const link = (url, urlTitle) => ({
  type: 'link',
  text: `[[${url}][${urlTitle}]]`});

const regularText = (t) => ({
  type: 'regular',
  text: `${t}`});

const codeText = (t) => ({
  type: 'code',
  text: `~${t}~`});

const strikeThroughText = (t) => ({
  type: 'strikeThrough',
  text: `+${t}+`});

const underlineTextCreator = (t) => ({
  type: 'underline',
  text: `_${t}_`});

const verbatimTextCreator = (t) => ({
  type: 'verbatim',
  text: `=${t}=`});

const boldTextCreator = (t) => ({
  type: 'bold',
  text: `*${t}*`});

const italicTextCreator = (t) => ({
  type: 'italic',
  text: `/${t}/`});

// ** Line containers

const regularLine = (elements) => ({
  type: 'regular',
  elements});

const listLine = (elements) => ({
  type: 'list',
  elements});

const checkboxLine = (elements) => ({
  type: 'checkbox',
  elements});

const numericListLine = (elements) => ({
  type: 'numericList',
  elements});

// * Test data

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
    [regularLine(
      [regularText('Nulla posuere.')])]
  ],

  withLink: [
    `Nulla posuere. ${link(...links.unknown)} Proin neque massa`,
    [regularLine([
      regularText('Nulla posuere.'),
      link('')])]]};

// ** Content

const contentToObjectsMappings = {

// *** Line types

  emptyLine: [
    '\n',
    [regularLine(
      [regularText('\n')])]],

  regularLine: [
    'Suspendisse potenti.  ',
    [regularLine(
      [regularText('Suspendisse potenti.  ')])]],

  twoLines: [
    'one\ntwo',
    [regularLine(regularText('one')),
     regularLine(regularText('two'))]
  ],

  listLine: [
    '- Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    [listLine(
      [regularText('Lorem ipsum dolor sit amet, consectetuer adipiscing elit.')])]],

  checkboxLine: [
    '- [ ] Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    [checkboxLine(
      [regularText('Lorem ipsum dolor sit amet, consectetuer adipiscing elit.')])]],

  checkboxLineWithBold: [
    '- [ ] *Lorem* ipsum dolor sit amet, consectetuer adipiscing elit.',
    [regularLine(
      [boldTextCreator('Lorem'),
       regularText('ipsum dolor sit amet, consectetuer adipiscing elit.')])]],

  numericListLine: [
    '1. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    [numericListLine(
      [regularText('Lorem ipsum dolor sit amet, consectetuer adipiscing elit.')])]],

// *** Faces

  strikeThroughLine: [
    'Proin quam nisl, +tincidunt+ et, mattis eget, +convallis+ nec, purus.  ',
    [regularLine(
      [regularText('Proin quam nisl, '),
       strikeThroughText('tincidunt'),
       regularText(' et, mattis eget, '),
       strikeThroughText('convallis'),
       regularText(' nec, purus.  ')])]],

  underlineLine: [
    'Nunc aliquet, augue _nec_ adipiscing interdum, lacus tellus malesuada massa, quis varius mi purus non odio.  ',
    [regularLine(
      [regularText('Nunc aliquet, augue') ,
       underlineTextCreator('nec') ,
       regularText(' adipiscing interdum, lacus tellus malesuada massa, quis varius mi purus non odio.  ')])]],

  boldLine: [
    'Fusce sagittis, libero non molestie mollis, *magna* orci ultrices dolor, at *vulputate* neque nulla *lacinia* eros.  ',
    [regularLine(
      [regularText('Fusce sagittis, libero non molestie mollis,') ,
       boldTextCreator('magna') ,
       regularText('orci ultrices dolor, at') ,
       boldTextCreator('vulputate') ,
       regularText('neque nulla') ,
       boldTextCreator('lacinia') ,
       regularText('eros.')])]],

  codeLine: [
    '~convallis~',
    [regularLine(
      [codeText('convallis')])]],

  verbatimLine: [
    '=Integer=',
    [regularLine(
      [verbatimTextCreator('Integer')])]],

  italicLine: [
    '/bibendum/',
    [regularLine(
      [italicTextCreator('bibendum')])]]

  // ** end

}


// * Tests

describe("mapNodeContentToObject", () => {

  test.only("returns input object in plainContent prop", () => {
    const testData = createNode();
    const expectation = testData;
    expect(mapNodeContentToObject(testData).plainContent).toBe(expectation)})

  test.only("mapping lines", () => {
    const testData = ;
    const expectation = ;
    expect(mapNodeContentToObject(testData)).toBe(expectation)
  });


})
