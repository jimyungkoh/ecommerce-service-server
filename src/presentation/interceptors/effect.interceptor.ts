import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Effect, pipe } from 'effect';
import { FiberFailureCauseId } from 'effect/Runtime';
import type { Observable } from 'rxjs';
import { catchError, mergeMap } from 'rxjs';
import { OpenTelemetryLayer } from 'src/common/telemetry';
import {
  AppAuthException,
  AppConflictException,
  ApplicationException,
  AppNotFoundException,
} from 'src/domain/exceptions';
import { SingletonLoggerService } from '../../common/logger';

@Injectable()
export class EffectInterceptor implements NestInterceptor {
  constructor(private readonly logger: SingletonLoggerService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;
    const spanName = `${className}.${methodName}`;

    return next.handle().pipe(
      mergeMap((value) => {
        return Effect.runPromise(
          pipe(
            Effect.if(Effect.isEffect(value), {
              onTrue: () => value,
              onFalse: () => Effect.tryPromise(() => value),
            }),
            Effect.flatMap((ret) => {
              return ret instanceof ApplicationException
                ? Effect.fail(ret)
                : Effect.succeed(ret);
            }),
            Effect.catchAll((error) => {
              throw error;
            }),
            Effect.withSpan(spanName, {
              attributes: {
                'http.method': req.method,
                'http.url': req.url,
                'http.route': req.route?.path,
              },
            }),
            OpenTelemetryLayer.default,
          ) as Effect.Effect<unknown, unknown, never>,
        );
      }),
      catchError((error) => {
        if (!Effect.isFailure(error)) throw error;
        switch (error[FiberFailureCauseId].defect._tag) {
          case 'AppAuthException':
            throw new AppAuthException(undefined, error.message);
          case 'AppNotFoundException':
            throw new AppNotFoundException(undefined, error.message);
          case 'AppConflictException':
            throw new AppConflictException(undefined, error.message);
          default:
            throw error;
        }
      }),
    );
  }
}
