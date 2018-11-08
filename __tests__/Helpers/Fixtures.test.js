/** @flow */

import { getOrgFileContent } from '../../src/Helpers/Fixtures';

test('opens fixtures file', () => {
  expect(getOrgFileContent('hello.org')).toEqual(['hello', '']);
});
