/** @flow */

import { parseHeadline } from '../../../src/OrgFormat/AtomicParsers/HeadlineParser';

describe('parseHeadline', () => {
  test('level 3 parsed', () => {
    expect(parseHeadline('*** header')).toMatchObject({
      level: 3,
    });
  });

  test('level 1 parsed', () => {
    expect(parseHeadline('* header')).toMatchObject({
      level: 1,
    });
  });

  test('headline parsed', () => {
    expect(
      parseHeadline('* Sed id ligula quis est convallis tempor.')
    ).toMatchObject({
      headline: 'Sed id ligula quis est convallis tempor.',
    });
  });

  test('one tag parsed', () => {
    expect(
      parseHeadline('* Sed id ligula quis est convallis tempor. :tag1:')
    ).toMatchObject({
      tags: [
        {
          isContextTag: false,
          name: 'tag1',
        },
      ],
      headline: 'Sed id ligula quis est convallis tempor.',
    });
  });

  test('two tags parsed', () => {
    expect(
      parseHeadline('* Sed id ligula quis est convallis tempor.   :@tag1:tag2:')
    ).toMatchObject({
      tags: [
        {
          isContextTag: true,
          name: 'tag1',
        },
        {
          isContextTag: false,
          name: 'tag2',
        },
      ],
      headline: 'Sed id ligula quis est convallis tempor.',
    });
  });

  test('three tags parsed', () => {
    expect(
      parseHeadline(
        '* Sed id ligula quis est convallis tempor. :tag1:tag2:tag3:'
      )
    ).toMatchObject({
      tags: [
        {
          isContextTag: false,
          name: 'tag1',
        },
        {
          isContextTag: false,
          name: 'tag2',
        },
        {
          isContextTag: false,
          name: 'tag3',
        },
      ],
      headline: 'Sed id ligula quis est convallis tempor.',
    });
  });

  test('priority A parsed', () => {
    expect(
      parseHeadline('* [#A] Sed id ligula quis est convallis tempor.')
    ).toMatchObject({
      priority: 'A',
      headline: 'Sed id ligula quis est convallis tempor.',
    });
  });

  test('priority B parsed', () => {
    expect(
      parseHeadline('* [#B] Sed id ligula quis est convallis tempor.')
    ).toMatchObject({
      priority: 'B',
      headline: 'Sed id ligula quis est convallis tempor.',
    });
  });

  test('priority C parsed', () => {
    expect(
      parseHeadline('* [#C] Sed id ligula quis est convallis tempor.')
    ).toMatchObject({
      priority: 'C',
      headline: 'Sed id ligula quis est convallis tempor.',
    });
  });

  test('DONE state parsed', () => {
    expect(
      parseHeadline('* DONE Sed id ligula quis est convallis tempor.')
    ).toMatchObject({
      todo: 'DONE',
      headline: 'Sed id ligula quis est convallis tempor.',
    });
  });

  test('todo should not be parsed', () => {
    expect(
      parseHeadline('* TODOSed TODO id ligula quis est convallis tempor.')
    ).toMatchObject({
      headline: 'TODOSed TODO id ligula quis est convallis tempor.',
    });
  });
});
