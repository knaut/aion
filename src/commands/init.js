import { ensureDir, pathExists } from 'fs-extra';
import { appendFile, readFile } from 'fs/promises';
import { join } from 'path';
import { theme } from '../ui/theme.js';

export async function initCommand() {
  const cwd = process.cwd();
  const agentsDir = join(cwd, '.claude', 'agents');
  const skillsDir = join(cwd, '.claude', 'skills');

  await ensureDir(agentsDir);
  await ensureDir(skillsDir);
  console.log(theme.success('✓ Created .claude/agents/'));
  console.log(theme.success('✓ Created .claude/skills/'));

  // Check and update .gitignore
  const gitignorePath = join(cwd, '.gitignore');
  const hasGitignore = await pathExists(gitignorePath);

  if (hasGitignore) {
    const contents = await readFile(gitignorePath, 'utf8');
    if (!contents.includes('.claude')) {
      await appendFile(gitignorePath, '\n.claude/\n');
      console.log(theme.success('✓ Added .claude/ to .gitignore'));
    } else {
      console.log(theme.muted('  .claude/ already in .gitignore'));
    }
  } else {
    await appendFile(gitignorePath, '.claude/\n');
    console.log(theme.success('✓ Created .gitignore with .claude/ entry'));
  }

  console.log(theme.muted('\nReady. Run `aion beam` to deploy a team.'));
}
