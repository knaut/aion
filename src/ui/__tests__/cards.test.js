import { describe, it, expect } from 'vitest';
import { toArray } from '../cards.js';

describe('toArray', () => {
  it('returns empty array for null', () => {
    expect(toArray(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(toArray(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(toArray('')).toEqual([]);
  });

  it('returns the same array when already an array', () => {
    const input = ['Read', 'Write', 'Bash'];
    expect(toArray(input)).toEqual(input);
  });

  it('splits comma-separated string', () => {
    expect(toArray('Read,Write,Bash')).toEqual(['Read', 'Write', 'Bash']);
  });

  it('trims whitespace from split values', () => {
    expect(toArray('Read , Write , Bash')).toEqual(['Read', 'Write', 'Bash']);
  });

  it('filters out empty strings after split', () => {
    expect(toArray('Read,,Write,,,Bash')).toEqual(['Read', 'Write', 'Bash']);
  });

  it('handles single value with no comma', () => {
    expect(toArray('Read')).toEqual(['Read']);
  });

  it('handles trailing comma', () => {
    expect(toArray('Read,Write,')).toEqual(['Read', 'Write']);
  });

  it('handles leading comma', () => {
    expect(toArray(',Read,Write')).toEqual(['Read', 'Write']);
  });

  it('returns empty array for string of only commas and whitespace', () => {
    expect(toArray(' , , , ')).toEqual([]);
  });

  it('preserves values with internal spaces', () => {
    expect(toArray('foo bar, baz qux')).toEqual(['foo bar', 'baz qux']);
  });
});
