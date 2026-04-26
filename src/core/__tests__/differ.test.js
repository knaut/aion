import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { md5, diffTeam } from '../differ.js';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

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

describe('diffTeam', () => {
  let tempDir;
  let sourceDir;

  beforeEach(() => {
    // Create temporary directory for test files
    tempDir = mkdtempSync(join(tmpdir(), 'aion-test-'));
    sourceDir = mkdtempSync(join(tmpdir(), 'aion-source-'));
  });

  afterEach(() => {
    // Clean up temporary directories
    rmSync(tempDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });

  it('returns empty array when team has no agents and target is empty', async () => {
    const team = { agents: [] };
    const result = await diffTeam(team, tempDir);
    expect(result).toEqual([]);
  });

  it('marks agent as "new" when it exists in source but not deployed', async () => {
    const agentPath = join(sourceDir, 'alpha.md');
    writeFileSync(agentPath, '---\nname: alpha\n---\nContent');

    const team = {
      agents: [{ filePath: agentPath }],
    };

    const result = await diffTeam(team, tempDir);
    expect(result).toEqual([{ name: 'alpha', status: 'new' }]);
  });

  it('marks agent as "synced" when source and deployed match', async () => {
    const content = '---\nname: alpha\n---\nContent';
    const agentPath = join(sourceDir, 'alpha.md');
    writeFileSync(agentPath, content);

    const deployedDir = join(tempDir, '.claude', 'agents');
    mkdirSync(deployedDir, { recursive: true });
    writeFileSync(join(deployedDir, 'alpha.md'), content);

    const team = {
      agents: [{ filePath: agentPath }],
    };

    const result = await diffTeam(team, tempDir);
    expect(result).toEqual([{ name: 'alpha', status: 'synced' }]);
  });

  it('marks agent as "modified" when source and deployed differ', async () => {
    const sourcePath = join(sourceDir, 'alpha.md');
    writeFileSync(sourcePath, '---\nname: alpha\n---\nNew content');

    const deployedDir = join(tempDir, '.claude', 'agents');
    mkdirSync(deployedDir, { recursive: true });
    writeFileSync(join(deployedDir, 'alpha.md'), '---\nname: alpha\n---\nOld content');

    const team = {
      agents: [{ filePath: sourcePath }],
    };

    const result = await diffTeam(team, tempDir);
    expect(result).toEqual([{ name: 'alpha', status: 'modified' }]);
  });

  it('does NOT mark agents from other teams as orphans', async () => {
    // Team A has only 'alpha'
    const alphaPath = join(sourceDir, 'alpha.md');
    writeFileSync(alphaPath, '---\nname: alpha\n---\nAlpha content');

    const teamA = {
      agents: [{ filePath: alphaPath }],
    };

    // Deploy both 'alpha' and 'beta' (beta belongs to a different team)
    const deployedDir = join(tempDir, '.claude', 'agents');
    mkdirSync(deployedDir, { recursive: true });
    writeFileSync(join(deployedDir, 'alpha.md'), '---\nname: alpha\n---\nAlpha content');
    writeFileSync(join(deployedDir, 'beta.md'), '---\nname: beta\n---\nBeta content');

    const result = await diffTeam(teamA, tempDir);

    // Should only show alpha as synced; beta should be ignored (not marked as orphan)
    expect(result).toEqual([{ name: 'alpha', status: 'synced' }]);
    expect(result.find((r) => r.name === 'beta')).toBeUndefined();
  });

  it('handles multiple agents from the same team correctly', async () => {
    const alphaPath = join(sourceDir, 'alpha.md');
    const betaPath = join(sourceDir, 'beta.md');
    const gammaPath = join(sourceDir, 'gamma.md');

    writeFileSync(alphaPath, '---\nname: alpha\n---\nAlpha content');
    writeFileSync(betaPath, '---\nname: beta\n---\nBeta content');
    writeFileSync(gammaPath, '---\nname: gamma\n---\nGamma content');

    const team = {
      agents: [
        { filePath: alphaPath },
        { filePath: betaPath },
        { filePath: gammaPath },
      ],
    };

    // Deploy only alpha (synced) and beta (modified)
    const deployedDir = join(tempDir, '.claude', 'agents');
    mkdirSync(deployedDir, { recursive: true });
    writeFileSync(join(deployedDir, 'alpha.md'), '---\nname: alpha\n---\nAlpha content');
    writeFileSync(join(deployedDir, 'beta.md'), '---\nname: beta\n---\nOld beta content');

    const result = await diffTeam(team, tempDir);

    expect(result).toHaveLength(3);
    expect(result.find((r) => r.name === 'alpha')).toEqual({ name: 'alpha', status: 'synced' });
    expect(result.find((r) => r.name === 'beta')).toEqual({ name: 'beta', status: 'modified' });
    expect(result.find((r) => r.name === 'gamma')).toEqual({ name: 'gamma', status: 'new' });
  });

  it('isolates teams: Team A diff ignores Team B deployed agents', async () => {
    // Team A source agents
    const teamAAlphaPath = join(sourceDir, 'team-a-alpha.md');
    writeFileSync(teamAAlphaPath, '---\nname: team-a-alpha\n---\nTeam A Alpha');

    const teamA = {
      agents: [{ filePath: teamAAlphaPath }],
    };

    // Team B source agents (not part of this diff)
    const teamBBetaPath = join(sourceDir, 'team-b-beta.md');
    writeFileSync(teamBBetaPath, '---\nname: team-b-beta\n---\nTeam B Beta');

    // Deploy agents from BOTH teams
    const deployedDir = join(tempDir, '.claude', 'agents');
    mkdirSync(deployedDir, { recursive: true });
    writeFileSync(join(deployedDir, 'team-a-alpha.md'), '---\nname: team-a-alpha\n---\nTeam A Alpha');
    writeFileSync(join(deployedDir, 'team-b-beta.md'), '---\nname: team-b-beta\n---\nTeam B Beta');

    const result = await diffTeam(teamA, tempDir);

    // Only Team A's agent should appear; Team B's agent should be completely ignored
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'team-a-alpha', status: 'synced' });
  });

  it('handles cross-team scenario: Team B diff ignores Team A deployed agents', async () => {
    // Team B source agents
    const teamBBetaPath = join(sourceDir, 'team-b-beta.md');
    writeFileSync(teamBBetaPath, '---\nname: team-b-beta\n---\nTeam B Beta');

    const teamB = {
      agents: [{ filePath: teamBBetaPath }],
    };

    // Deploy agents from BOTH teams
    const deployedDir = join(tempDir, '.claude', 'agents');
    mkdirSync(deployedDir, { recursive: true });
    writeFileSync(join(deployedDir, 'team-a-alpha.md'), '---\nname: team-a-alpha\n---\nTeam A Alpha');
    writeFileSync(join(deployedDir, 'team-b-beta.md'), '---\nname: team-b-beta\n---\nTeam B Beta');

    const result = await diffTeam(teamB, tempDir);

    // Only Team B's agent should appear; Team A's agent should be ignored
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'team-b-beta', status: 'synced' });
  });

  it('handles empty deployed directory gracefully', async () => {
    const agentPath = join(sourceDir, 'alpha.md');
    writeFileSync(agentPath, '---\nname: alpha\n---\nContent');

    const team = {
      agents: [{ filePath: agentPath }],
    };

    // Don't create .claude/agents directory at all
    const result = await diffTeam(team, tempDir);
    expect(result).toEqual([{ name: 'alpha', status: 'new' }]);
  });

  it('handles agents with identical basenames from different source paths', async () => {
    // This tests that we're using basename correctly
    const sourceSubdir = join(sourceDir, 'subdir');
    mkdirSync(sourceSubdir, { recursive: true });
    const agentPath = join(sourceSubdir, 'alpha.md');
    writeFileSync(agentPath, '---\nname: alpha\n---\nContent from subdir');

    const team = {
      agents: [{ filePath: agentPath }],
    };

    const deployedDir = join(tempDir, '.claude', 'agents');
    mkdirSync(deployedDir, { recursive: true });
    writeFileSync(join(deployedDir, 'alpha.md'), '---\nname: alpha\n---\nContent from subdir');

    const result = await diffTeam(team, tempDir);
    expect(result).toEqual([{ name: 'alpha', status: 'synced' }]);
  });
});
