import * as clack from '@clack/prompts';
import { getHomeRepo, setLastDeployed } from '../core/config.js';
import { buildRegistry } from '../core/registry.js';
import { deployTeam } from '../core/deployer.js';
import { beamSpinner } from '../ui/spinners.js';
import { selectTeam } from '../ui/prompts.js';
import { theme } from '../ui/theme.js';
import { pathExists } from 'fs-extra';
import { join } from 'path';
import { existsSync } from 'fs';

export async function beamCommand(teamArg, opts = {}) {
  const homeRepo = getHomeRepo();
  if (!homeRepo) {
    console.error(theme.error('Home repo not configured. Run `aion config` first.'));
    process.exit(1);
  }

  const cwd = process.cwd();

  // Pre-flight checks
  const hasClaude = existsSync(join(cwd, 'CLAUDE.md')) || existsSync(join(cwd, '.claude'));
  if (!hasClaude) {
    console.log(theme.warning('⚠️  No CLAUDE.md or .claude/ found in this directory.'));
    console.log(theme.muted('   Consider running `aion init` first.'));
  }

  if (!existsSync(homeRepo)) {
    console.error(theme.error(`Home repo not reachable: ${homeRepo}`));
    process.exit(1);
  }

  const hasGitignore = existsSync(join(cwd, '.gitignore'));
  if (hasGitignore) {
    const { readFileSync } = await import('fs');
    const gi = readFileSync(join(cwd, '.gitignore'), 'utf8');
    if (!gi.includes('.claude')) {
      console.log(theme.warning('⚠️  .claude/ is not in your .gitignore.'));
    }
  }

  const registry = await buildRegistry(homeRepo);

  let teamName = teamArg;
  if (!teamName) {
    teamName = await selectTeam(registry);
  }

  const team = registry.find(t => t.name === teamName);
  if (!team) {
    console.error(theme.error(`Team "${teamName}" not found in home repo.`));
    process.exit(1);
  }

  const projectName = cwd.split('/').pop();
  const spinner = beamSpinner(teamName, projectName).start();

  try {
    const deployed = await deployTeam(team, cwd, homeRepo, { forceClaude: opts.forceClaude });
    setLastDeployed(cwd, [teamName]);
    spinner.succeed(theme.success(`🚀 Beamed ${teamName} to ${projectName}`));
    console.log(theme.muted(`   ${deployed.agents.length} agents, ${deployed.skills.length} skills`));
    console.log(theme.muted(`   ${new Date().toLocaleTimeString()}`));
  } catch (err) {
    spinner.fail(theme.error('Beam failed.'));
    console.error(err.message);
    process.exit(1);
  }
}
