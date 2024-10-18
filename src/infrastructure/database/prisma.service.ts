import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { WinstonLoggerService } from 'src/common/logger/winston.logger.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly logger: WinstonLoggerService,
    options?: Prisma.PrismaClientOptions,
  ) {
    super(options || {});
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (e) {
      if (e instanceof Error) {
        return this.logger.error(e.message, e.stack, 'PrismaService');
      }

      this.logger.error(
        'An unknown error occurred during connection',
        '',
        'PrismaService',
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (e) {
      if (e instanceof Error) {
        return this.logger.error(e.message, e.stack, 'PrismaService');
      }

      this.logger.error(
        'An unknown error occurred during disconnection',
        '',
        'PrismaService',
      );
    }
  }
}
