import { getHomeRepo } from '../core/config.js';
import { buildRegistry } from '../core/registry.js';
import { diffTeam } from '../core/differ.js';
import { diffSpinner } from '../ui/spinners.js';
import { selectTeam } from '../ui/prompts.js';
import { theme } from '../ui/theme.js';
import { existsSync } from 'fs';

const STATUS_ICON = {
  synced:   theme.success('✓'),
  modified: theme.error('✗'),
  new:      theme.accent('✦'),
  orphan:   theme.muted('–'),
};

export async function diffCommand(teamArg) {
  const homeRepo = getHomeRepo();
  if (!homeRepo) {
    console.error(theme.error('Home repo not configured. Run `aion config` first.'));
    process.exit(1);
  }

  const cwd = process.cwd();
  const registry = await buildRegistry(homeRepo);

  let teams;
  if (teamArg) {
    const t = registry.find(t => t.name === teamArg);
    if (!t) { console.error(theme.error(`Team "${teamArg}" not found.`)); process.exit(1); }
    teams = [t];
  } else {
    // Diff all deployed teams
    teams = registry;
  }

  const spinner = diffSpinner().start();

  try {
    spinner.stop();
    for (const team of teams) {
      console.log(`\n${theme.primary(team.name.toUpperCase())}`);
      const results = await diffTeam(team, cwd);
      if (results.length === 0) {
        console.log(theme.muted('  no agents found'));
        continue;
      }
      for (const r of results) {
        console.log(`  ${STATUS_ICON[r.status]}  ${theme.accent(r.name)}  ${theme.muted(r.status)}`);
      }
    }
    console.log();
  } catch (err) {
    spinner.fail(theme.error('Diff failed.'));
    console.error(err.message);
    process.exit(1);
  }
}
