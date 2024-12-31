import { Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Effect, pipe } from 'effect';
import { CustomConfigService } from 'src/common/config/custom-config.service';
import { Infrastructure } from 'src/common/decorators';
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
      // setInterval(
      //   () => pipe(this.monitorConnection(), Effect.runPromise),
      //   3_000,
      // );
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
    options: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    } = {
      maxWait: 2_000,
      timeout: 2_000,
    },
  ): Effect.Effect<R, Error, never> {
    const effectWithTransaction = (tx: Prisma.TransactionClient) =>
      new Promise<R>((res, rej) => {
        const program = Effect.match(
          pipe(
            effect(tx),
            Effect.catchAll((error) => {
              if (error instanceof ApplicationException)
                return Effect.fail(error);

              return Effect.fail(
                new AppConflictException(undefined, error.message),
              );
            }),
          ),
          {
            onSuccess: (value) => res(value),
            onFailure: (error) => rej(error),
          },
        );

        Effect.runPromise(program);
      });

    return pipe(
      Effect.tryPromise({
        try: () => this.$transaction(effectWithTransaction, options),
        catch: (error) =>
          error instanceof ApplicationException
            ? error
            : new AppConflictException(undefined),
      }),
    );
  }
}
