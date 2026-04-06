import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { StructuredLoggerService } from './structured-logger.service';
import { StructuredLoggingInterceptor } from './structured-logging.interceptor';

@Global()
@Module({
  providers: [
    StructuredLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: StructuredLoggingInterceptor,
    },
  ],
  exports: [StructuredLoggerService],
})
export class LoggingModule {}
