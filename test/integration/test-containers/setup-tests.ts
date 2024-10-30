import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { TransientLoggerServiceToken } from 'src/common/logger';
import { WinstonLogger } from 'src/common/logger/winston/winston.logger';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { TestDataFactory } from '../helpers/test-data.factory';

let prismaService: PrismaService;
let logger: WinstonLogger;
let testDataFactory: TestDataFactory;

beforeAll(async () => {
  // 테스트 모듈 설정
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // Prisma & Logger 설정
  prismaService = moduleFixture.get(PrismaService);
  logger = await moduleFixture.resolve(TransientLoggerServiceToken);
  testDataFactory = new TestDataFactory(prismaService);
});

afterAll(async () => {
  await prismaService.$disconnect();
});

export { logger, prismaService, testDataFactory };
