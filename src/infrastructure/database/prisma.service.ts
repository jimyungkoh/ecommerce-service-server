import { Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { Infrastructure } from 'src/common/decorators';
import { ErrorCodes } from 'src/common/errors';
import { AppLogger, TransientLoggerServiceToken } from 'src/common/logger';
import {
  AppConflictException,
  ApplicationException,
} from 'src/domain/exceptions';

@Infrastructure()
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
      log: [
        // { emit: 'event', level: 'query' },
        // { emit: 'event', level: 'error' },
      ],
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
          Effect.tapErrorCause((cause) =>
            Effect.sync(() =>
              this.logger.error(`transaction failed: ${cause}`),
            ),
          ),
        ),
      );

    return pipe(
      Effect.tryPromise(() =>
        this.$transaction(effectWithTransaction, {
          maxWait: 3_000,
          timeout: 3_000,
        }),
      ),
      Effect.flatMap((ret) =>
        ret instanceof ApplicationException
          ? Effect.fail(ret)
          : Effect.succeed(ret),
      ),
      Effect.catchAll(() =>
        Effect.fail(new AppConflictException(ErrorCodes.ORDER_FAILED)),
      ),
    );
  }
}
