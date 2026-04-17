import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../registry.js';

describe('parseFrontmatter', () => {
  it('returns empty object when no frontmatter present', () => {
    expect(parseFrontmatter('# Just a heading')).toEqual({});
    expect(parseFrontmatter('')).toEqual({});
  });

  it('parses scalar string values', () => {
    const content = `---
name: alpha
model: claude-sonnet-4
---
# Body`;
    expect(parseFrontmatter(content)).toEqual({
      name: 'alpha',
      model: 'claude-sonnet-4',
    });
  });

  it('normalises boolean true (lowercase)', () => {
    const content = `---
director: true
---`;
    expect(parseFrontmatter(content)).toEqual({
      director: true,
    });
  });

  it('normalises boolean true (uppercase)', () => {
    const content = `---
director: True
---`;
    expect(parseFrontmatter(content)).toEqual({
      director: true,
    });
  });

  it('normalises boolean false (lowercase)', () => {
    const content = `---
active: false
---`;
    expect(parseFrontmatter(content)).toEqual({
      active: false,
    });
  });

  it('normalises boolean false (mixed case)', () => {
    const content = `---
active: FALSE
---`;
    expect(parseFrontmatter(content)).toEqual({
      active: false,
    });
  });

  it('parses bracket array syntax', () => {
    const content = `---
tools: [Read, Write, Bash]
tags: [ui, design]
---`;
    expect(parseFrontmatter(content)).toEqual({
      tools: ['Read', 'Write', 'Bash'],
      tags: ['ui', 'design'],
    });
  });

  it('handles empty bracket arrays', () => {
    const content = `---
tools: []
---`;
    expect(parseFrontmatter(content)).toEqual({
      tools: [],
    });
  });

  it('trims whitespace in bracket arrays', () => {
    const content = `---
tools: [ Read , Write , Bash ]
---`;
    expect(parseFrontmatter(content)).toEqual({
      tools: ['Read', 'Write', 'Bash'],
    });
  });

  it('parses folded block scalar (>)', () => {
    const content = `---
description: >
  A multi-line
  folded scalar that
  should be joined
---`;
    expect(parseFrontmatter(content)).toEqual({
      description: 'A multi-line folded scalar that should be joined',
    });
  });

  it('parses literal block scalar (|)', () => {
    const content = `---
description: |
  First line
  Second line
  Third line
---`;
    expect(parseFrontmatter(content)).toEqual({
      description: 'First line Second line Third line',
    });
  });

  it('handles empty block scalars', () => {
    const content = `---
description: >
---`;
    expect(parseFrontmatter(content)).toEqual({
      description: '',
    });
  });

  it('ignores indented continuation lines without a key', () => {
    const content = `---
key: value
  indented continuation
another: thing
---`;
    expect(parseFrontmatter(content)).toEqual({
      key: 'value',
      another: 'thing',
    });
  });

  it('handles Windows line endings (CRLF)', () => {
    const content = "---\r\nname: test\r\ndirector: true\r\n---\r\n# Body";
    expect(parseFrontmatter(content)).toEqual({
      name: 'test',
      director: true,
    });
  });

  it('handles mixed scalar types in one document', () => {
    const content = `---
name: alpha
director: true
tools: [Read, Write]
bio: >
  A multi-line bio
  spanning two lines
---`;
    expect(parseFrontmatter(content)).toEqual({
      name: 'alpha',
      director: true,
      tools: ['Read', 'Write'],
      bio: 'A multi-line bio spanning two lines',
    });
  });

  it('preserves non-boolean strings that contain "true" or "false"', () => {
    const content = `---
status: truely amazing
verdict: falsehood
---`;
    expect(parseFrontmatter(content)).toEqual({
      status: 'truely amazing',
      verdict: 'falsehood',
    });
  });

  it('handles keys with no value', () => {
    const content = `---
name:
description: something
---`;
    expect(parseFrontmatter(content)).toEqual({
      name: '',
      description: 'something',
    });
  });
});
