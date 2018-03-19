/** @flow */

import R from "ramda";

import { dateIsCorrect } from "../../src/OrgFormat/Validators";

describe("date not validates", () => {
  test("incorrect month", () => {
    expect(dateIsCorrect(2012, 13, 4)).toBeFalsy();
  });

  test("january 2017", () => {
    expect(dateIsCorrect(2017, 1, 0)).toBeFalsy();
  });

  test("february 2017", () => {
    expect(dateIsCorrect(2017, 2, 29)).toBeFalsy();
  });

  test("november 2017", () => {
    expect(dateIsCorrect(2017, 11, 31)).toBeFalsy();
  });
});

describe("date validates", () => {
  test("january 2017", () => {
    expect(dateIsCorrect(2017, 1, 31)).toBeTruthy();
  });

  test("february 2017", () => {
    expect(dateIsCorrect(2017, 2, 28)).toBeTruthy();
  });

  test("november 2017", () => {
    expect(dateIsCorrect(2017, 11, 30)).toBeTruthy();
  });
});
