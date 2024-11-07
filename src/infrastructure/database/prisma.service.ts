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
    super({
      datasources: {
        db: {
          url: configService.databaseUrl,
        },
      },
    });
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

  withTransaction = <R, E extends Error>(
    effect: (tx: Prisma.TransactionClient) => Effect.Effect<R, E>,
  ): Effect.Effect<R, E> => {
    return pipe(
      Effect.tryPromise({
        try: () =>
          this.$transaction(async (tx) => {
            // Effect를 Promise로 변환하여 실행
            const result = await Effect.runPromise(effect(tx));
            return result;
          }),
        catch: (error) => {
          this.logger.error(`transaction failed: ${JSON.stringify(error)}`);
          return error as E;
        },
      }),
      Effect.catchAll((error) => {
        this.logger.error(`Effect transaction error: ${error.message}`);
        return Effect.fail(error as E);
      }),
    );
  };
}
