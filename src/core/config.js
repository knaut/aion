import Conf from 'conf';

const store = new Conf({
  projectName: 'aion',
  schema: {
    homeRepo: { type: 'string' },
    lastDeployed: { type: 'object', default: {} },
  },
});

export function getHomeRepo() {
  return store.get('homeRepo');
}

export function setHomeRepo(path) {
  store.set('homeRepo', path);
}

export function getLastDeployed(projectPath) {
  const all = store.get('lastDeployed') ?? {};
  return all[projectPath] ?? null;
}

export function setLastDeployed(projectPath, teams) {
  const all = store.get('lastDeployed') ?? {};
  all[projectPath] = { teams, timestamp: new Date().toISOString() };
  store.set('lastDeployed', all);
}
