import figlet from 'figlet';
import { theme } from './theme.js';

// · tile, 1 per 4 chars, uniform sparse, deterministic by row
function starPad(width, rowIndex) {
  if (width <= 0) return '';
  const chars = Array(width).fill(' ');
  // Stagger grid by row so dots form a diagonal scatter, not a vertical stripe
  const offset = (rowIndex * 2) % 4;
  for (let col = offset; col < width; col += 4) {
    chars[col] = '·';
  }
  return chars.join('');
}

export function renderLogo() {
  const termWidth = process.stdout.columns || 80;

  // Small Slant — compact, italic lean reads as velocity
  const text = figlet.textSync('aion', { font: 'Small Slant' });
  const lines = text.split('\n').filter((_, i, arr) => !(i === arr.length - 1 && !_.trim()));

  // Find the max figlet line width and center the block
  const figWidth = Math.max(...lines.map(l => l.length));
  const leftWidth = Math.max(0, Math.floor((termWidth - figWidth) / 2));
  const rightWidth = Math.max(0, termWidth - leftWidth - figWidth);

  // One full-width star row above
  console.log(theme.muted(starPad(termWidth, 0)));

  // Composite: star-field | figlet line | star-field
  lines.forEach((line, i) => {
    const row = i + 1;
    const left = starPad(leftWidth, row);
    const right = starPad(rightWidth, row);
    const figLine = line.padEnd(figWidth);
    console.log(theme.muted(left) + theme.primary(figLine) + theme.muted(right));
  });

  // One full-width star row below
  console.log(theme.muted(starPad(termWidth, lines.length + 1)));

  console.log(theme.muted('\n  agent, skills & team manager for Claude Code\n'));
}
