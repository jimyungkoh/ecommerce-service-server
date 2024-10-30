import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { ApplicationException } from 'src/domain/exceptions/application.exception';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> | Promise<Observable<unknown>> {
    return next.handle().pipe(
      catchError((exception) =>
        throwError(() => {
          if (exception instanceof HttpException) {
            throw exception;
          } else if (exception instanceof ApplicationException) {
            throw exception.toHttp();
          } else {
            throw new InternalServerErrorException();
          }
        }),
      ),
    );
  }
}
