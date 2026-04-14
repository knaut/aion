import * as clack from '@clack/prompts';
import { existsSync } from 'fs';
import { getHomeRepo, setHomeRepo } from '../core/config.js';
import { theme } from '../ui/theme.js';

export async function configCommand() {
  const current = getHomeRepo();
  if (current) {
    console.log(`${theme.muted('current home repo:')} ${theme.primary(current)}`);
  }

  const input = await clack.text({
    message: 'Path to your agents home repo:',
    placeholder: '/Users/you/Repos/agents',
    initialValue: current ?? '',
    validate(value) {
      if (!value.trim()) return 'Path is required.';
      if (!existsSync(value.trim())) return `Directory not found: ${value.trim()}`;
    },
  });

  if (clack.isCancel(input)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }

  setHomeRepo(input.trim());
  console.log(theme.success(`Home repo set: ${input.trim()}`));
}
