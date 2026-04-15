import * as clack from '@clack/prompts';
import { getHomeRepo } from '../core/config.js';
import { buildRegistry } from '../core/registry.js';
import { agentCard, skillCard } from '../ui/cards.js';
import { theme } from '../ui/theme.js';

export async function bioCommand(nameArg) {
  const homeRepo = getHomeRepo();
  if (!homeRepo) {
    console.error(theme.error('Home repo not configured. Run `aion config` first.'));
    process.exit(1);
  }

  const registry = await buildRegistry(homeRepo);
  const allAgents = registry.flatMap(t => t.agents);
  const allSkills = registry.flatMap(t => t.skills);

  let name = nameArg;
  if (!name) {
    const agentOptions = allAgents.map(a => ({
      value: `agent:${a.name}`,
      label: `${theme.accent(a.name)}  ${theme.muted(`[${a.team}]`)}`,
    }));
    const skillOptions = allSkills.map(s => ({
      value: `skill:${s.name}`,
      label: `${theme.primary(s.name)}  ${theme.muted(`[${s.team}] skill`)}`,
    }));

    const choice = await clack.select({
      message: 'Select an agent or skill:',
      options: [...agentOptions, ...skillOptions],
    });
    if (clack.isCancel(choice)) { clack.cancel('Cancelled.'); process.exit(0); }

    const [type, chosen] = choice.split(':');
    if (type === 'skill') {
      const skill = allSkills.find(s => s.name === chosen);
      console.log(skillCard(skill));
    } else {
      const agent = allAgents.find(a => a.name === chosen);
      console.log(agentCard(agent));
    }
    return;
  }

  // Named lookup: check agents first, then skills
  const agent = allAgents.find(a => a.name === name);
  if (agent) { console.log(agentCard(agent)); return; }

  const skill = allSkills.find(s => s.name === name);
  if (skill) { console.log(skillCard(skill)); return; }

  console.error(theme.error(`"${name}" not found as agent or skill.`));
  process.exit(1);
}
