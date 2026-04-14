import fg from 'fast-glob';
import { readFileSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';

// Simple YAML frontmatter parser (avoids a full yaml dep)
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const raw = match[1];
  const result = {};
  for (const line of raw.split(/\r?\n/)) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      const val = rest.join(':').trim();
      // Detect arrays (simple bracket form: [a, b, c])
      if (val.startsWith('[') && val.endsWith(']')) {
        result[key.trim()] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
      } else {
        result[key.trim()] = val;
      }
    }
  }
  return result;
}

let _cache = null;

/** Parse the home repo and return teams[]. Cached per session. */
export async function buildRegistry(homeRepo) {
  if (_cache) return _cache;

  // Discover all .md agent files under agents/ directories
  const agentFiles = await fg('**/agents/**/*.md', {
    cwd: homeRepo,
    absolute: true,
    ignore: ['**/node_modules/**'],
  });

  // Discover all skill directories (contain a SKILL.md)
  const skillFiles = await fg('**/skills/**/SKILL.md', {
    cwd: homeRepo,
    absolute: true,
    ignore: ['**/node_modules/**'],
  });

  const teamsMap = {};

  for (const filePath of agentFiles) {
    const content = readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);
    const name = basename(filePath, '.md');

    // Derive team from directory structure: .../teams/<team>/agents/<agent>.md
    const parts = filePath.split('/');
    const agentsIdx = parts.lastIndexOf('agents');
    const team = agentsIdx > 0 ? parts[agentsIdx - 1] : 'default';

    if (!teamsMap[team]) teamsMap[team] = { name: team, director: null, agents: [], skills: [] };

    const agent = { name, team, filePath, frontmatter };
    teamsMap[team].agents.push(agent);

    // First agent with a director flag becomes director
    if (!teamsMap[team].director && frontmatter.director === 'true') {
      teamsMap[team].director = agent;
    }
  }

  for (const skillPath of skillFiles) {
    const content = readFileSync(skillPath, 'utf8');
    const frontmatter = parseFrontmatter(content);
    const dirPath = dirname(skillPath);
    const name = basename(dirPath);

    // Derive team similarly
    const parts = dirPath.split('/');
    const skillsIdx = parts.lastIndexOf('skills');
    const team = skillsIdx > 0 ? parts[skillsIdx - 1] : 'default';

    if (!teamsMap[team]) teamsMap[team] = { name: team, director: null, agents: [], skills: [] };
    teamsMap[team].skills.push({ name, team, dirPath, description: frontmatter.description ?? '' });
  }

  _cache = Object.values(teamsMap);
  return _cache;
}

export function clearRegistryCache() {
  _cache = null;
}
