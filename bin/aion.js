#!/usr/bin/env node

import { program } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { beamCommand } from '../src/commands/beam.js';
import { diffCommand } from '../src/commands/diff.js';
import { syncCommand } from '../src/commands/sync.js';
import { listCommand } from '../src/commands/list.js';
import { bioCommand } from '../src/commands/bio.js';
import { configCommand } from '../src/commands/config.js';
import { initCommand } from '../src/commands/init.js';
import { runInteractiveMenu } from '../src/ui/prompts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

program
  .name('aion')
  .description('Agent, skills, and sub-agent team manager for Claude Code')
  .version(pkg.version);

program
  .command('beam [team]')
  .description('Deploy team agents and skills to current project')
  .option('--force-claude', 'Overwrite CLAUDE.md if already present')
  .action(beamCommand);

program
  .command('diff [team]')
  .description('Compare deployed agents against home repo source')
  .action(diffCommand);

program
  .command('sync [team]')
  .description('Push locally modified agents back to home repo')
  .action(syncCommand);

program
  .command('list')
  .description('Show team roster: agents, skills, directors')
  .option('--json', 'Output as JSON')
  .action(listCommand);

program
  .command('bio [agent]')
  .description('Show agent or skill profile card')
  .action(bioCommand);

program
  .command('config')
  .description('Set or update home repo path')
  .action(configCommand);

program
  .command('init')
  .description('Scaffold .claude/ structure in current directory')
  .action(initCommand);

// No args -> interactive menu
if (process.argv.length === 2) {
  runInteractiveMenu();
} else {
  program.parse();
}
