export interface FirebaseApp {
  name: string;
  options: Record<string, unknown>;
}

const apps: FirebaseApp[] = [];

export function initializeApp(options: Record<string, unknown>, name = '[DEFAULT]') {
  const existing = apps.find((app) => app.name === name);
  if (existing) {
    return existing;
  }

  const app: FirebaseApp = { name, options };
  apps.push(app);
  return app;
}

export function getApps() {
  return [...apps];
}

export function getApp(name = '[DEFAULT]') {
  const app = apps.find((candidate) => candidate.name === name);

  if (!app) {
    throw new Error(`Firebase app '${name}' has not been initialized.`);
  }

  return app;
}
