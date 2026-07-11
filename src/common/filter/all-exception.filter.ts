import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ExceptionResponseBody {
  message?: string | string[];
  error?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const response = context.getResponse<Response>();

    const request = context.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';

    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (this.isExceptionResponseBody(exceptionResponse)) {
        message = exceptionResponse.message ?? exception.message;

        error = exceptionResponse.error ?? exception.name;
      }
    } else {
      this.logUnexpectedException(exception, request);
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  private isExceptionResponseBody(
    value: unknown,
  ): value is ExceptionResponseBody {
    return typeof value === 'object' && value !== null;
  }

  private logUnexpectedException(exception: unknown, request: Request): void {
    const message = `${request.method} ${request.originalUrl}`;

    if (exception instanceof Error) {
      this.logger.error(message, exception.stack);

      return;
    }

    this.logger.error(message, String(exception));
  }
}
