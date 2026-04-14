import * as clack from '@clack/prompts';
import { renderLogo } from './logo.js';
import { theme } from './theme.js';

export async function runInteractiveMenu() {
  renderLogo();

  const action = await clack.select({
    message: 'What would you like to do?',
    options: [
      { value: 'beam',   label: `${theme.primary('beam')}   — deploy team to this project` },
      { value: 'diff',   label: `${theme.primary('diff')}   — compare deployed vs home repo` },
      { value: 'sync',   label: `${theme.primary('sync')}   — push local edits back to home repo` },
      { value: 'list',   label: `${theme.primary('list')}   — view team roster` },
      { value: 'bio',    label: `${theme.primary('bio')}    — view agent or skill profile` },
      { value: 'config', label: `${theme.primary('config')} — set home repo path` },
      { value: 'init',   label: `${theme.primary('init')}   — scaffold .claude/ in this directory` },
    ],
  });

  if (clack.isCancel(action)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }

  // Dynamically import and run the selected command
  const { [`${action}Command`]: fn } = await import(`../commands/${action}.js`);
  await fn();
}

/** Shared prompt: select a team from registry */
export async function selectTeam(teams) {
  const choice = await clack.select({
    message: 'Select a team:',
    options: teams.map(t => ({ value: t.name, label: t.name })),
  });
  if (clack.isCancel(choice)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return choice;
}

/** Shared prompt: confirm an action */
export async function confirm(message) {
  const answer = await clack.confirm({ message });
  if (clack.isCancel(answer)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return answer;
}
