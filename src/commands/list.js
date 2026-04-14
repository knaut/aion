import { getHomeRepo } from '../core/config.js';
import { buildRegistry } from '../core/registry.js';
import { teamCard } from '../ui/cards.js';
import { theme } from '../ui/theme.js';

export async function listCommand(opts = {}) {
  const homeRepo = getHomeRepo();
  if (!homeRepo) {
    console.error(theme.error('Home repo not configured. Run `aion config` first.'));
    process.exit(1);
  }

  const registry = await buildRegistry(homeRepo);

  if (opts.json) {
    console.log(JSON.stringify(registry, null, 2));
    return;
  }

  for (const team of registry) {
    console.log(teamCard(team));
  }
}
