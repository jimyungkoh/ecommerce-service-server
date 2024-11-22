import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { exec } from 'child_process';
import { nanoid } from 'nanoid';
import { StartedNetwork, StartedTestContainer } from 'testcontainers';
import { promisify } from 'util';
import { KafkaContainer } from '@testcontainers/kafka';

const execAsync = promisify(exec);

interface GlobalContainers {
  database?: StartedMySqlContainer;
  kafka?: StartedTestContainer;
  network?: StartedNetwork;
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

async function initializeKafka(): Promise<string> {
  try {
    const kafkaContainer = await new KafkaContainer()
      .withKraft()
      .withEnvironment({
        KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: '1',
        KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: '1',
        KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: '1',
        KAFKA_LOG_FLUSH_INTERVAL_MESSAGES: '1',
        KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: '0',
        KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true',
      })
      .withExposedPorts(9093)
      .start();

    global.containers['kafka'] = kafkaContainer;

    return `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9093)}`;
  } catch (e) {
    throw e;
  }
}

function setEnvironmentVariables(containerUrls: {
  [key: string]: string;
}): void {
  Object.assign(process.env, {
    ...DEFAULT_ENV,
    SALT: '10',
    NODE_ENV: 'test',
    JWT_SECRET: nanoid(17),
    DATABASE_URL: containerUrls.databaseUrl,
    KAFKA_BROKERS: containerUrls.kafkaUrl,
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
    const kafkaUrl = await initializeKafka();
    setEnvironmentVariables({ databaseUrl, kafkaUrl });
    await runMigrations();
  } catch (error) {
    throw error;
  }
}

export default globalBefore;
