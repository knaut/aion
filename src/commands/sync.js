import * as clack from '@clack/prompts';
import { copy } from 'fs-extra';
import { join, basename } from 'path';
import { getHomeRepo } from '../core/config.js';
import { buildRegistry } from '../core/registry.js';
import { diffTeam } from '../core/differ.js';
import { syncSpinner } from '../ui/spinners.js';
import { selectTeam, confirm } from '../ui/prompts.js';
import { theme } from '../ui/theme.js';

export async function syncCommand(teamArg) {
  const homeRepo = getHomeRepo();
  if (!homeRepo) {
    console.error(theme.error('Home repo not configured. Run `aion config` first.'));
    process.exit(1);
  }

  const cwd = process.cwd();
  const registry = await buildRegistry(homeRepo);

  let teamName = teamArg;
  if (!teamName) teamName = await selectTeam(registry);

  const team = registry.find(t => t.name === teamName);
  if (!team) { console.error(theme.error(`Team "${teamName}" not found.`)); process.exit(1); }

  // Always diff first
  const results = await diffTeam(team, cwd);
  const modified = results.filter(r => r.status === 'modified');

  if (modified.length === 0) {
    console.log(theme.success('All agents are in sync — nothing to push.'));
    return;
  }

  console.log(`\n${theme.warning(`${modified.length} modified agent(s) to sync:`)}`);
  for (const r of modified) {
    console.log(`  ${theme.accent(r.name)}`);
  }
  console.log();

  const spinner = syncSpinner();

  for (const r of modified) {
    const ok = await confirm(`Sync ${theme.accent(r.name)} back to home repo?`);
    if (!ok) continue;

    const agent = team.agents.find(a => a.name === r.name);
    const srcDeployed = join(cwd, '.claude', 'agents', basename(agent.filePath));

    spinner.start();
    await copy(srcDeployed, agent.filePath, { overwrite: true });
    spinner.succeed(theme.success(`Synced ${r.name}`));
  }

  console.log(theme.muted('\nRemember to commit your home repo.'));
}
