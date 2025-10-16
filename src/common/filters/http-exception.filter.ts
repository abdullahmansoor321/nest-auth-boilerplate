import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Normalize exception response to ensure message is always a string
    let message: string;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    if (exceptionResponse) {
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        const m = resp['message'];
        if (Array.isArray(m)) {
          message = m.map(String).join(', ');
        } else if (typeof m === 'string') {
          message = m;
        } else {
          // If message is an object or other non-primitive, stringify it safely
          try {
            if (m === null || m === undefined) {
              message = '';
            } else if (typeof m === 'object') {
              message = JSON.stringify(m);
            } else if (typeof m === 'number' || typeof m === 'boolean') {
              message = String(m);
            } else if (typeof m === 'string') {
              message = m;
            } else {
              // Fallback for other types
              try {
                message = JSON.stringify(m);
              } catch {
                message = 'Internal Server Error';
              }
            }
          } catch {
            message = 'Internal Server Error';
          }
        }
      } else {
        // Fallback to stringifying the full response object
        try {
          message = JSON.stringify(exceptionResponse as Record<string, unknown>);
        } catch {
          message = 'Internal Server Error';
        }
      }
    } else if (typeof exception === 'object' && exception !== null && 'message' in exception) {
      const e = exception as Record<string, unknown>;
      const em = e['message'];
      if (typeof em === 'string') {
        message = em;
      } else {
        try {
          message = JSON.stringify(em ?? 'Internal Server Error');
        } catch {
          message = 'Internal Server Error';
        }
      }
    } else if (typeof exception === 'string') {
      message = exception;
    } else {
      message = 'Internal Server Error';
    }

    const errorResponse = {
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    const stack = (exception as Error)?.stack;
    this.logger.error(`Status ${status} Error: ${JSON.stringify(message)}`, stack);

    response.status(status).json(errorResponse);
  }
}
