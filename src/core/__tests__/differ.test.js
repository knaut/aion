import { describe, it, expect } from 'vitest';
import { md5 } from '../differ.js';

describe('md5', () => {
  it('hashes a string deterministically', () => {
    const input = 'Hello, world!';
    const hash1 = md5(input);
    const hash2 = md5(input);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(32);
  });

  it('produces known hash for known input', () => {
    // Known MD5 hash of "test"
    expect(md5('test')).toBe('098f6bcd4621d373cade4e832627b4f6');
  });

  it('produces different hashes for different inputs', () => {
    const hash1 = md5('foo');
    const hash2 = md5('bar');
    expect(hash1).not.toBe(hash2);
  });

  it('handles empty string', () => {
    const hash = md5('');
    expect(hash).toBe('d41d8cd98f00b204e9800998ecf8427e'); // known MD5 of empty string
    expect(hash).toHaveLength(32);
  });

  it('handles Buffer input', () => {
    const buffer = Buffer.from('test');
    expect(md5(buffer)).toBe('098f6bcd4621d373cade4e832627b4f6');
  });

  it('handles unicode characters', () => {
    const hash = md5('Hello 世界 🌍');
    expect(hash).toHaveLength(32);
    expect(hash).toBe(md5('Hello 世界 🌍')); // deterministic
  });

  it('handles multiline strings', () => {
    const input = `---
name: test
director: true
---`;
    const hash = md5(input);
    expect(hash).toHaveLength(32);
    expect(hash).toBe(md5(input)); // deterministic
  });
});
