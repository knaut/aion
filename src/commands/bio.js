import * as clack from '@clack/prompts';
import { getHomeRepo } from '../core/config.js';
import { buildRegistry } from '../core/registry.js';
import { agentCard } from '../ui/cards.js';
import { theme } from '../ui/theme.js';

export async function bioCommand(agentArg) {
  const homeRepo = getHomeRepo();
  if (!homeRepo) {
    console.error(theme.error('Home repo not configured. Run `aion config` first.'));
    process.exit(1);
  }

  const registry = await buildRegistry(homeRepo);
  const allAgents = registry.flatMap(t => t.agents);

  let agentName = agentArg;
  if (!agentName) {
    const choice = await clack.select({
      message: 'Select an agent:',
      options: allAgents.map(a => ({
        value: a.name,
        label: `${a.name}  ${theme.muted(`[${a.team}]`)}`,
      })),
    });
    if (clack.isCancel(choice)) { clack.cancel('Cancelled.'); process.exit(0); }
    agentName = choice;
  }

  const agent = allAgents.find(a => a.name === agentName);
  if (!agent) {
    console.error(theme.error(`Agent "${agentName}" not found.`));
    process.exit(1);
  }

  console.log(agentCard(agent));
}
