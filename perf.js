import R from 'ramda';

var Realm = require('realm');

// import { configureFileAccess } from './src/Helpers/FileAccess';
import OrgApi from './src';

// var promisify = require("promisify-node");
// const fsInterface = promisify("fs")
// OrgApi.configureDb(Realm)
// OrgApi.connectDb()
// OrgApi.clearDb()
// configureFileAccess(fsInterface)

module.exports = testNum => {
  const start = Date.now();
  // OrgApi.importFile('~/Org/projects.org')
  const end = Date.now();
  return end - start;
};
