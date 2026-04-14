import ora from 'ora';
import { theme } from './theme.js';

export function beamSpinner(team, project) {
  return ora({
    text: `Beaming ${theme.accent(team)} to ${theme.primary(project)}...`,
    color: 'cyan',
  });
}

export function diffSpinner() {
  return ora({
    text: theme.muted('Scanning transporter logs...'),
    color: 'cyan',
  });
}

export function syncSpinner() {
  return ora({
    text: theme.muted('Syncing to source...'),
    color: 'cyan',
  });
}

export function genericSpinner(text) {
  return ora({ text, color: 'cyan' });
}
