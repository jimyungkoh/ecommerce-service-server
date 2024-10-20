import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

interface GlobalContainers {
  database?: StartedPostgreSqlContainer;
}

declare global {
  // eslint-disable-next-line no-var
  var containers: GlobalContainers;
}

const DEFAULT_ENV: Readonly<NodeJS.ProcessEnv> = Object.freeze({
  TESTS_RUN: 'integration',
  NODE_ENV: 'integration-tests',
});

const initializeDatabase = async (): Promise<string> => {
  const database = await new PostgreSqlContainer().start();
  global.containers = { database };

  return `postgresql://${database.getUsername()}:${database.getPassword()}@${database.getHost()}:${database.getPort()}/${database.getDatabase()}`;
};

const setEnvironmentVariables = (databaseUrl: string): void => {
  process.env = {
    ...process.env,
    ...DEFAULT_ENV,
    DATABASE_URL: databaseUrl,
  };
};

const globalBefore = async (): Promise<void> => {
  const databaseUrl = await initializeDatabase();
  setEnvironmentVariables(databaseUrl);
};

export default globalBefore;
