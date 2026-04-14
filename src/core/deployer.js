import { copy, ensureDir, pathExists } from 'fs-extra';
import { join, basename } from 'path';

/**
 * Deploy a team's agents and skills into the target project's .claude/ directory.
 * Returns { agents: string[], skills: string[] } of deployed names.
 */
export async function deployTeam(team, targetDir, opts = {}) {
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

  // Handle CLAUDE.md
  const sourceClaude = join(/* homeRepo would be passed */ team._homeRepo ?? '', 'CLAUDE.md');
  const destClaude = join(targetDir, 'CLAUDE.md');
  if (opts.forceClaude || !(await pathExists(destClaude))) {
    if (await pathExists(sourceClaude)) {
      await copy(sourceClaude, destClaude, { overwrite: opts.forceClaude });
    }
  }

  return deployed;
}
