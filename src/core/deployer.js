import { copy, ensureDir, pathExists } from 'fs-extra';
import { join, basename } from 'path';

/**
 * Deploy a team's agents and skills into the target project's .claude/ directory.
 * @param {object} team - team object from registry
 * @param {string} targetDir - absolute path to target project root
 * @param {string} homeRepo - absolute path to home repo root
 * @param {object} opts - { forceClaude: boolean }
 * @returns {{ agents: string[], skills: string[] }}
 */
export async function deployTeam(team, targetDir, homeRepo, opts = {}) {
  const agentsDir = join(targetDir, '.claude', 'agents');
  const skillsDir = join(targetDir, '.claude', 'skills');

  await ensureDir(agentsDir);

  const deployed = { agents: [], skills: [] };

  for (const agent of team.agents) {
    const dest = join(agentsDir, basename(agent.filePath));
    await copy(agent.filePath, dest, { overwrite: true });
    deployed.agents.push(agent.name);
  }

  if (team.skills.length > 0) {
    await ensureDir(skillsDir);
    for (const skill of team.skills) {
      const dest = join(skillsDir, skill.name);
      await copy(skill.dirPath, dest, { overwrite: true });
      deployed.skills.push(skill.name);
    }
  }

  // CLAUDE.md: copy from home repo root only if not already present (or --force-claude)
  const sourceClaude = join(homeRepo, 'CLAUDE.md');
  const destClaude = join(targetDir, 'CLAUDE.md');
  if (await pathExists(sourceClaude)) {
    if (opts.forceClaude || !(await pathExists(destClaude))) {
      await copy(sourceClaude, destClaude, { overwrite: true });
    }
  }

  return deployed;
}
