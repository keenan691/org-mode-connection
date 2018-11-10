import { getObjects } from './src/Data/Queries/RealmQueries';
import OrgApi from './src';

export const getFirstFileAsPlainObject = async () => {
  const files = await OrgApi.getAllFilesAsPlainObject();
  const file = await OrgApi.getFileAsPlainObject(files[0].id);
  return file;
};

export const getFirstFile = async () => {
  const files = await getObjects('OrgFile');
  return files[0];
};
