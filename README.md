# aion

**Agent, skills, and sub-agent team manager for Claude Code.**

`aion` (pronounced *aye-own*) is a CLI tool for deploying and managing teams of [Claude Code](https://claude.ai/code) agents and skills across projects. It presupposes you have a home repo of agents organized by team, and are copying-and-moving (e.g. "beaming") them to work on projects elsewhere.

The name is a pun on αἰών — Greek deity of time/eternity, plus *agents on*, plus *ai-on*.

---

## Install

```bash
npm install -g aion
```

Or clone and link locally:

```bash
git clone https://github.com/yourusername/aion
cd aion
npm install
npm link
```

Then point `aion` at your agents home repo:

```bash
aion config
```

---

## Home repo structure

`aion` expects your agents repo to be organized by team:

```
agents/
  engineering/
    einstein.md
    curie.md
    bose.md
    skills/
      einstein-generate-wormhole/
        SKILL.md
        ...
  music/
    coltrane.md
    davis.md
    skills/
```

Each agent is a standard Claude Code agent `.md` file with YAML frontmatter (`name`, `description`, `model`, `tools`). Skills are directories containing a `SKILL.md`.

---

## Commands

### `aion` — interactive menu

Run with no arguments to open the TUI menu. From there you can explore your agent rosters, skills, and bios.

---

### `aion beam [team]`

Deploy a team's agents and skills into `.claude/` in the current directory.

```bash
aion beam engineering
```

```
✔ 🚀 Beamed engineering to my-project
   10 agents, 5 skills
   9:51:25 PM
```

Runs pre-flight checks: confirms `.claude/` exists, home repo is reachable, and `.claude/` is gitignored. Pass `--force-claude` to overwrite an existing `CLAUDE.md`.

---

### `aion diff [team]`

Compare deployed agents against home repo source by checksum.

```bash
aion diff engineering
```

```
ENGINEERING
  ✓  einstein    synced
  ✓  curie       synced
  ✗  bose        modified
  ✦  herschel    new in home repo
  –  archimedes  orphan
```

| Symbol | Meaning |
|--------|---------|
| `✓` | In sync |
| `✗` | Modified locally |
| `✦` | New in home repo, not yet deployed |
| `–` | Deployed but removed from home repo |

---

### `aion sync [team]`

Push locally modified agents back to the home repo. Always diffs first, then prompts per file.

```bash
aion sync engineering
```

```
1 modified agent(s) to sync:
  bose

? Sync bose back to home repo? › yes

✔ Synced bose

Remember to commit your home repo.
```

Never syncs automatically. Always explicit confirmation.

---

### `aion list`

Roster view — teams, agents, skills, directors.

```bash
aion list
```

### `aion bio [agent|skill]`

Terse profile card for an agent or skill.

```bash
aion bio einstein
aion bio einstein-generate-wormhole
```

---

### `aion init`

Scaffold `.claude/agents/` and `.claude/skills/` in the current directory. Appends `.claude/` to `.gitignore` if missing.

```bash
aion init
```

---

### `aion config`

Set or update the path to your agents home repo.

```bash
aion config
```

Config is stored at `~/.config/aion/config.json`. Re-run on any machine to set the local path — the home repo path may differ per device.

---

## How it works

`aion` parses your home repo at runtime into a registry of teams, agents, and skills. No static data files. The registry is cached in memory per session.

Deployment (`beam`) copies agent `.md` files into `.claude/agents/` and skill directories into `.claude/skills/`. The diff command uses MD5 checksums to detect local modifications. Sync copies modified deployed files back to the home repo source.

---

## License

MIT
