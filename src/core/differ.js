import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import fg from 'fast-glob';
import { join, basename } from 'path';

function md5(filePath) {
  return createHash('md5').update(readFileSync(filePath)).digest('hex');
}

/**
 * Compare deployed agents in targetDir against team source in home repo.
 * Returns array of { name, status } where status is one of:
 *   'synced'    — identical
 *   'modified'  — deployed copy differs from source
 *   'new'       — exists in home repo, not deployed here
 *   'orphan'    — deployed here, removed from home repo
 */
export async function diffTeam(team, targetDir) {
  const agentsDir = join(targetDir, '.claude', 'agents');
  const results = [];

  // Build map of source agents
  const sourceMap = {};
  for (const agent of team.agents) {
    sourceMap[basename(agent.filePath)] = agent.filePath;
  }

  // Build map of deployed agents
  const deployedFiles = existsSync(agentsDir)
    ? await fg('*.md', { cwd: agentsDir, absolute: true })
    : [];
  const deployedMap = {};
  for (const f of deployedFiles) {
    deployedMap[basename(f)] = f;
  }

  const allNames = new Set([...Object.keys(sourceMap), ...Object.keys(deployedMap)]);

  for (const name of allNames) {
    const src = sourceMap[name];
    const dep = deployedMap[name];

    if (src && dep) {
      const status = md5(src) === md5(dep) ? 'synced' : 'modified';
      results.push({ name: basename(name, '.md'), status });
    } else if (src && !dep) {
      results.push({ name: basename(name, '.md'), status: 'new' });
    } else {
      results.push({ name: basename(name, '.md'), status: 'orphan' });
    }
  }

  return results;
}
