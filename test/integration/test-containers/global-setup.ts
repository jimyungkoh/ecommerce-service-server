import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { exec } from 'child_process';
import { nanoid } from 'nanoid';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GlobalContainers {
  database?: StartedPostgreSqlContainer;
  redis?: StartedRedisContainer;
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
    const database = await new PostgreSqlContainer()
      .withCommand(['-c', 'max_connections=100']) // 커넥션 제한 증가
      .start();
    global.containers = { ...global.containers, database };

    return database.getConnectionUri();
  } catch (error) {
    throw error;
  }
}

async function initializeRedisCluster(): Promise<{
  host: string;
  port: number;
}> {
  try {
    const redis = await new RedisContainer().start();
    const host = redis.getHost();
    const port = redis.getPort();
    global.containers = { ...global.containers, redis };
    return { host, port };
  } catch (error) {
    throw error;
  }
}

function setEnvironmentVariables(
  databaseUrl: string,
  redis: { host: string; port: number },
): void {
  Object.assign(process.env, {
    ...DEFAULT_ENV,
    SALT: '10',
    NODE_ENV: 'test',
    JWT_SECRET: nanoid(17),
    DATABASE_URL: databaseUrl,
    REDIS_HOST: redis.host,
    REDIS_PORT: redis.port.toString(),
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
    const redis = await initializeRedisCluster();

    setEnvironmentVariables(databaseUrl, redis);
    await runMigrations();
  } catch (error) {
    throw error;
  }
}

export default globalBefore;
