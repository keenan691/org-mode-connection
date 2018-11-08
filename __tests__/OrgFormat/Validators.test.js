/** @flow */

import R from 'ramda';

import { dateIsCorrect } from '../../src/OrgFormat/Validators';

describe('date not validates', () => {
  test('incorrect month', () => {
    expect(dateIsCorrect(2012, 12, 4)).toBeFalsy();
  });

  test('january 2017', () => {
    expect(dateIsCorrect(2017, 0, 0)).toBeFalsy();
  });

  test('february 2017', () => {
    expect(dateIsCorrect(2017, 1, 29)).toBeFalsy();
  });

  test('november 2017', () => {
    expect(dateIsCorrect(2017, 10, 31)).toBeFalsy();
  });
});

describe('date validates', () => {
  test('january 2017', () => {
    expect(dateIsCorrect(2017, 0, 31)).toBeTruthy();
  });

  test('february 2017', () => {
    expect(dateIsCorrect(2017, 1, 28)).toBeTruthy();
  });

  test('february 2018', () => {
    expect(dateIsCorrect(2018, 1, 28)).toBeTruthy();
  });

  test('september 2017', () => {
    expect(dateIsCorrect(2017, 7, 30)).toBeTruthy();
  });

  test('november 2017', () => {
    expect(dateIsCorrect(2017, 10, 30)).toBeTruthy();
  });
});
