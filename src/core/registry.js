import fg from 'fast-glob';
import { readFileSync } from 'fs';
import { join, basename, dirname, relative } from 'path';

// Simple YAML frontmatter parser (avoids a full yaml dep)
// Handles: scalar strings, bracket arrays, and folded block scalars (>)
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const lines = match[1].split(/\r?\n/);
  const result = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1 || line.startsWith(' ')) { i++; continue; }

    const key = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();

    // Folded (>) or literal (|) block scalar — collect indented lines that follow
    if (rest === '>' || rest === '|') {
      const blocks = [];
      i++;
      while (i < lines.length && (lines[i].startsWith(' ') || lines[i] === '')) {
        blocks.push(lines[i].trim());
        i++;
      }
      result[key] = blocks.join(' ').trim();
      continue;
    }

    // Bracket array: [a, b, c]
    if (rest.startsWith('[') && rest.endsWith(']')) {
      result[key] = rest.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else {
      result[key] = rest;
    }
    i++;
  }

  return result;
}

let _cache = null;

/** Parse the home repo and return teams[]. Cached per session.
 *
 * Expected home repo structure:
 *   <homeRepo>/
 *     <team>/
 *       <agent>.md
 *       skills/
 *         <skill-name>/
 *           SKILL.md
 */
export async function buildRegistry(homeRepo) {
  if (_cache) return _cache;

  // Agents: direct .md files inside top-level team directories
  // Pattern *\/*.md matches <team>/<agent>.md only (no nesting)
  const agentFiles = await fg('*/*.md', {
    cwd: homeRepo,
    absolute: true,
    ignore: ['**/node_modules/**', '**/skills/**'],
  });

  // Skills: SKILL.md files inside <team>/skills/<skill-name>/
  const skillFiles = await fg('*/skills/*/SKILL.md', {
    cwd: homeRepo,
    absolute: true,
    ignore: ['**/node_modules/**'],
  });

  const teamsMap = {};

  for (const filePath of agentFiles) {
    // Relative path is <team>/<agent>.md
    const rel = relative(homeRepo, filePath);
    const parts = rel.split('/');
    if (parts.length !== 2) continue; // skip anything not at exactly one level deep

    const teamName = parts[0];
    const agentFile = parts[1];

    // Skip non-agent .md files at team root
    if (agentFile === 'CLAUDE.md' || agentFile === 'README.md') continue;

    const content = readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);
    const name = basename(filePath, '.md');

    if (!teamsMap[teamName]) {
      teamsMap[teamName] = { name: teamName, director: null, agents: [], skills: [] };
    }

    const agent = { name, team: teamName, filePath, frontmatter };
    teamsMap[teamName].agents.push(agent);

    if (!teamsMap[teamName].director && (frontmatter.director === 'true' || name === 'picard')) {
      teamsMap[teamName].director = agent;
    }
  }

  for (const skillPath of skillFiles) {
    // Relative path is <team>/skills/<skill-name>/SKILL.md
    const rel = relative(homeRepo, skillPath);
    const parts = rel.split('/');
    if (parts.length !== 4) continue; // <team>/skills/<name>/SKILL.md

    const teamName = parts[0];
    const skillName = parts[2];
    const dirPath = dirname(skillPath);

    const content = readFileSync(skillPath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    if (!teamsMap[teamName]) {
      teamsMap[teamName] = { name: teamName, director: null, agents: [], skills: [] };
    }

    teamsMap[teamName].skills.push({
      name: skillName,
      team: teamName,
      dirPath,
      description: frontmatter.description ?? '',
    });
  }

  _cache = Object.values(teamsMap);
  return _cache;
}

export function clearRegistryCache() {
  _cache = null;
}
