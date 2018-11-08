import R from 'ramda';

let FileSystemInterface = null;

export const configureFileAccess = fsInterface => {
  FileSystemInterface = fsInterface;
};

export default {
  stat: path => FileSystemInterface.stat(path),
  exists: path => FileSystemInterface.exists(path),
  write: (path, content) => FileSystemInterface.writeFile(path, content),
  read: path =>
    FileSystemInterface.readFile(path, 'utf8').then(content =>
      content.split('\n')
    ),
};
