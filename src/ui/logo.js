import figlet from 'figlet';
import { theme } from './theme.js';

export function renderLogo() {
  // Font TBD — Lubalin consult deferred to v1.1
  const text = figlet.textSync('aion', { font: 'Slant' });
  console.log(theme.primary(text));
  console.log(theme.muted('  agent, skills & team manager for Claude Code\n'));
}
