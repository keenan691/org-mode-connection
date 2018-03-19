/** @flow */

import R from "ramda";

import {
  nodeMetadataParser,
} from '../../../src/OrgFormat/AtomicParsers/NodeMetadataParser';


describe("scheduled and deadline metadata parses", () => {
  it("scheduled parses", () => {
    expect(nodeMetadataParser(["SCHEDULED: <2018-02-22 czw>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 22)}]}], []])});

  it("deadline parses", () => {
    expect(nodeMetadataParser(["DEADLINE: <2018-02-22 czw>"]))
      .toEqual([[{timestamps: [{
        type: "deadline",
        date: new Date(2018, 1, 22)}]}], []])})});

describe("scheduled metadata with repeater", () => {
  it("with hourly repeater parses", () => {
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-22 czw +4h>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 22),
        repeater: "+4h"}]}], []])});

  it("with daily repeater parses", () => {
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-22 czw +4d>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 22),
        repeater: "+4d"}]}], []])});

  it("with weekly repeater parses", () => {
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-22 czw +4w>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 22),
        repeater: "+4w"}]}], []])});

  it("with monthly repeater parses", () => {
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-22 czw +4m>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 22),
        repeater: "+4m"}]}], []])});

  it("with yearly repeater parses", () => {
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-22 czw +4y>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 22),
        repeater: "+4y"}]}], []])});

  it("with shifting ++ repeater parses", () => {
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-22 czw ++4y>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 22),
        repeater: "++4y"}]}], []])});

  it("with shifting .+ repeater parses", () => {
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-22 czw .+4y>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 22),
        repeater: ".+4y"}]}], []])})});


describe("scheduled metadata with warning period parses", () => {
  it("with hourly warning period parses", () => {
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-22 czw -3h>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 22),}]}], []])});

  it("with daily warning period parses", () => {
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-22 czw -3d>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 22),}]}], []])});

  it("with monthly warning period parses", () => {
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-22 czw -3m>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 22),}]}], []])})});

describe("scheduled metadata with repeater and warning period parses", () => {
  it("with hourly warning period parses", () => {
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-22 czw +4d -3h>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 22),
        repeater: "+4d",}]}], []])})});

describe("deadline with repeater and warning period parses", () => {
  it("deadline parses", () => {
    expect(
      nodeMetadataParser(["DEADLINE: <2018-02-22 czw +3d -1d>"]))
      .toEqual([[{timestamps: [{
        type: "deadline",
        date: new Date(2018, 1, 22),
        repeater: "+3d",
        warningPeriod: "-1d"}]}], []])})});

describe("must not parse", () => {
  it("wrong date", () => {
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-57 czw +3d -1d>"]))
      .toEqual([[],["SCHEDULED: <2018-02-57 czw +3d -1d>"]])});

  it("wrong repeater", () => {
    expect(
      nodeMetadataParser(["DEADLINE: <2018-02-17 czw +3j -1d>"]))
      .toEqual([[{timestamps: [{
        type: "deadline",
        date: new Date(2018, 1, 17)}]}], []])});

  it("wrong warning period", () => {
    expect(
      nodeMetadataParser(["DEADLINE: <2018-02-17 czw> +3d -1j"]))
      .not.toEqual([[{timestamps: [{
        warningPeriod: expect.anything()}]}], []])});

  it("switched repeater with warning period", () => {
    // TODO Check if this works in org mode, parsers parses it as warning perion even when they are switchedw
    // Maybe in org mode order isn't important
    expect(
      nodeMetadataParser(["SCHEDULED: <2018-02-17 czw -3d +2d>"]))
      .toEqual([[{timestamps: [{
        type: "scheduled",
        date: new Date(2018, 1, 17)}]}], []])})});

describe("Drawers", () => {
  it("Drawer is parsed", () => {
    expect(
      nodeMetadataParser([
        ':LOGBOOK:',
        'CLOCK: [2017-11-07 wto 20:45]--[2017-11-07 wto 21:14] =>  0:29',
        ':END:']))
      .toEqual([[{
        drawers: {
          LOGBOOK: [
            'CLOCK: [2017-11-07 wto 20:45]--[2017-11-07 wto 21:14] =>  0:29']}}],
                []])});
})

test("Closed date is closed", () => {
  expect(
    nodeMetadataParser(["    CLOSED: [2018-02-02 pią 21:16]"]))
    .toEqual([[{timestamps: [{
      type: "closed",
      date: new Date(2018, 1, 2, 21, 16)}]}],
              []])});

describe("Timestaps parses", () => {

  it("Active plain timestamp parses", () => {
    expect(
      nodeMetadataParser(["<2003-09-16 Tue>"]))
      .toEqual([[{
        timestamps: [{
          date: new Date(2003, 8, 16),
          type: "active"
        }] }], ["<2003-09-16 Tue>"]])});

  it("Active plain timestamp with time parses", () => {
    expect(
      nodeMetadataParser(["<2003-09-16 Tue 09:35>"]))
      .toEqual([[{
        timestamps: [{
          date: new Date(2003, 8, 16, 9, 35),
          type: "active"
        }] }], ["<2003-09-16 Tue 09:35>"]])});

  it("Active plain timestamp with time range parses", () => {
    expect(
      nodeMetadataParser(["<2003-09-16 Tue 20:00-22:00>"]))
      .toEqual([[{
        timestamps: [{
          date: new Date(2003, 8, 16, 20),
          type: "active",
          dateRangeEnd: new Date(2003, 8, 16, 22)}]}], ["<2003-09-16 Tue 20:00-22:00>"]])});

  it("Active timestamps with repeater interval parses", () => {
    expect(
      nodeMetadataParser(["<2003-09-16 Tue +1w>"]))
      .toEqual([[{
        timestamps: [{
          date: new Date(2003, 8, 16),
          type: "active",
          repeater: "+1w"
        }] }], ["<2003-09-16 Tue +1w>"]])});

  it("Active timestamps with date range parses", () => {
    expect(
      nodeMetadataParser(["<2003-09-16 Tue>--<2003-09-23 Tue>"]))
      .toEqual([[{
        timestamps: [{
          date: new Date(2003, 8, 16),
          dateRangeEnd: new Date(2003, 8, 23),
          type: "active"
        }] }], ["<2003-09-16 Tue>--<2003-09-23 Tue>"]])});

  it("Multiple Active plain timestamps parses", () => {
    expect(
      nodeMetadataParser(["<2003-09-16 Tue>",
                          "<2003-09-17 Tue> <2003-09-18 Tue>"]))
      .toEqual([[{
        timestamps: [
          {date: new Date(2003, 8, 16), type: "active"},
          {date: new Date(2003, 8, 17), type: "active"},
          {date: new Date(2003, 8, 18), type: "active"}
        ] }], ["<2003-09-16 Tue>", "<2003-09-17 Tue> <2003-09-18 Tue>"]])});

  it("Multiple Active plain timestamps duplicates don't parses", () => {
    expect(
      nodeMetadataParser(["<2003-09-16 Tue>",
                          "<2003-09-17 Tue> <2003-09-17 Tue>"]))
      .toEqual([[{
        timestamps: [
          { date: new Date(2003, 8, 16), type: "active" },
          { date: new Date(2003, 8, 17), type: "active" },
        ] }], ["<2003-09-16 Tue>", "<2003-09-17 Tue> <2003-09-17 Tue>"]])});

})
