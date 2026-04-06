import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Request, Response } from 'express';
import { StructuredLoggerService } from './structured-logger.service';

/** POST/PATCH/DELETE — мутации; PUT (профиль, пароль) только в business-событиях и error-логах. */
const MUTATING = new Set(['POST', 'PATCH', 'DELETE']);

@Injectable()
export class StructuredLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const method = req.method;
    const path = req.originalUrl ?? req.url ?? '';
    const start = Date.now();
    let requestFailed = false;

    return next.handle().pipe(
      catchError((err: unknown) => {
        requestFailed = true;
        this.logHttpError(err, method, path);
        if (MUTATING.has(method)) {
          const statusCode =
            err instanceof HttpException
              ? err.getStatus()
              : HttpStatus.INTERNAL_SERVER_ERROR;
          this.logger.logRecord({
            type: 'http_mutation',
            method,
            path,
            statusCode,
            durationMs: Date.now() - start,
          });
        }
        return throwError(() => err);
      }),
      finalize(() => {
        if (!MUTATING.has(method) || requestFailed) {
          return;
        }
        const res = http.getResponse<Response>();
        this.logger.logRecord({
          type: 'http_mutation',
          method,
          path,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
        });
      }),
    );
  }

  private logHttpError(err: unknown, method: string, path: string): void {
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
    const stack = err instanceof Error ? err.stack : undefined;
    const name = err instanceof Error ? err.name : 'UnknownError';
    const statusCode =
      err instanceof HttpException ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.logRecord({
      type: 'error',
      name,
      message,
      stack,
      method,
      path,
      statusCode,
    });
  }
}
