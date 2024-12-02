import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import { ApplicationException } from 'src/domain/exceptions';

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

  transaction<R>(
    effect: (tx: Prisma.TransactionClient) => Effect.Effect<R, Error, never>,
  ): Effect.Effect<R | ApplicationException, Error, never> {
    const effectWithTransaction = async (tx: Prisma.TransactionClient) =>
      Effect.runPromise(
        pipe(
          effect(tx),
          Effect.catchIf(
            (e) => e instanceof ApplicationException,
            (e) => Effect.succeed(e),
          ),
        ),
      );

    return Effect.tryPromise(() => this.$transaction(effectWithTransaction));
  }
}
