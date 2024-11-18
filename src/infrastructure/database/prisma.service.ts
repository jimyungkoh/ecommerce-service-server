import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Effect } from 'effect';
import { stringify } from 'flatted';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  AppConflictException,
  AppNotFoundException,
} from 'src/domain/exceptions';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject(TransientLoggerServiceToken)
    private readonly logger: AppLogger,
    private readonly configService: CustomConfigService,
  ) {
    const databaseUrl = configService.databaseUrl;
    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      // log: [{ emit: 'event', level: 'query' }],
    });
    this.$on('query' as never, (e: Prisma.QueryEvent) =>
      this.logger.info(JSON.stringify(e)),
    );
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (e) {
      if (e instanceof Error) {
        return this.logger.error(e.message);
      }

      this.logger.error('An unknown error occurred during connection');
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (e) {
      if (e instanceof Error) {
        return this.logger.error(e.message);
      }

      this.logger.error('An unknown error occurred during disconnection');
    }
  }

  transaction<R, E extends Error>(
    effect: (tx: Prisma.TransactionClient) => Effect.Effect<R, E, never>,
    conflictMessage: string,
  ): Effect.Effect<R, E, never> {
    return Effect.tryPromise({
      try: () =>
        this.$transaction(async (tx) => {
          return Effect.runPromise(effect(tx)); // -> Promise<R, UnknownException>
        }),
      catch: (error) => {
        const parsedError = stringify(error);
        if (parsedError.includes('AppNotFoundException')) {
          throw new AppNotFoundException(undefined, (error as Error).message);
        } else if (parsedError.includes('AppConflictException')) {
          throw new AppConflictException(undefined, (error as Error).message);
        }

        throw new AppConflictException(undefined, conflictMessage);
      },
    });
  }
}
