import R from 'ramda';

import { parser } from './Common';

const getObj = R.pipe(R.pluck('parsedObj'), R.last);

const lazyInLineParser = (regex, transform, wrapIn = null) => {
  const terminator = R.reduced;
  const parseLine = R.pipe(
    R.match(regex),
    R.unless(R.isEmpty, R.apply(transform))
  );

  const makeOutput = (inputObjects, inputLines, parserOutput) => {
    if (parserOutput.length > 0) {
      if (wrapIn) {
        inputObjects.push({ [wrapIn]: [getObj(parserOutput)] });
      } else {
        inputObjects.push(getObj(parserOutput));
      }
      inputLines[0] = inputLines[0].replace(regex, '');
    }
    return [inputObjects, inputLines];
  };
  return parser(parseLine, makeOutput, terminator);
};

export { lazyInLineParser };
