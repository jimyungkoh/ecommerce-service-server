import { execSync } from 'child_process';
import { Client } from 'pg';
import { WinstonLoggerService } from 'src/common/logger';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

let prismaService: PrismaService;
let logger: WinstonLoggerService;
let postgresClient: Client;

beforeAll(async () => {
  // 컨테이너 연결
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postgresClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await postgresClient.connect();
  execSync('npx prisma migrate dev --preview-feature');

  logger = new WinstonLoggerService();
  // Prisma 인스턴스 설정
  prismaService = new PrismaService(logger, {
    log: ['query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
});

afterAll(async () => {
  await prismaService.$disconnect();
  await postgresClient.end();
});

jest.setTimeout(30_000);

export { logger, postgresClient, prismaService };
