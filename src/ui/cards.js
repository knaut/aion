import boxen from 'boxen';
import { theme } from './theme.js';

/** Render a terse agent profile card */
export function agentCard(agent) {
  const lines = [
    `${theme.accent(agent.name)}  ${theme.muted(`[${agent.team}]`)}`,
    `${theme.muted('model:')}  ${agent.frontmatter?.model ?? theme.muted('unset')}`,
    `${theme.muted('tools:')}  ${(agent.frontmatter?.tools ?? []).join(', ') || theme.muted('none')}`,
  ];

  if (agent.frontmatter?.description) {
    lines.push('');
    lines.push(theme.muted(agent.frontmatter.description));
  }

  return boxen(lines.join('\n'), {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
  });
}

/** Render a team roster panel */
export function teamCard(team) {
  const agentNames = team.agents.map(a => theme.accent(a.name)).join(', ') || theme.muted('none');
  const skillNames = team.skills.map(s => theme.primary(s.name)).join(', ') || theme.muted('none');
  const director = team.director ? theme.accent(team.director.name) : theme.muted('none');

  const lines = [
    theme.primary(team.name.toUpperCase()),
    `${theme.muted('director:')} ${director}`,
    `${theme.muted('agents:')}  ${agentNames}`,
    `${theme.muted('skills:')}  ${skillNames}`,
  ];

  return boxen(lines.join('\n'), {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
  });
}
