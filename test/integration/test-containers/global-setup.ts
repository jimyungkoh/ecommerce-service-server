import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { exec } from 'child_process';
import { nanoid } from 'nanoid';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GlobalContainers {
  database?: StartedMySqlContainer;
}

declare global {
  // eslint-disable-next-line no-var
  var containers: GlobalContainers;
}

const DEFAULT_ENV: Readonly<NodeJS.ProcessEnv> = Object.freeze({
  TESTS_RUN: 'integration',
  NODE_ENV: 'integration-tests',
});

async function initializeDatabase(): Promise<string> {
  try {
    const database = await new MySqlContainer().start();
    global.containers = { database };

    return database.getConnectionUri();
  } catch (error) {
    throw error;
  }
}

function setEnvironmentVariables(databaseUrl: string): void {
  Object.assign(process.env, {
    ...DEFAULT_ENV,
    SALT: '10',
    NODE_ENV: 'test',
    JWT_SECRET: nanoid(17),
    DATABASE_URL: databaseUrl,
  });
}

async function runMigrations(): Promise<void> {
  try {
    await execAsync('npx prisma migrate deploy');
  } catch (error) {
    throw error;
  }
}

async function globalBefore(): Promise<void> {
  try {
    const databaseUrl = await initializeDatabase();
    setEnvironmentVariables(databaseUrl);
    await runMigrations();
  } catch (error) {
    throw error;
  }
}

export default globalBefore;
