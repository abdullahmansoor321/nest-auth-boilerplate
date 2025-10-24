import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpAdapter = this.httpAdapterHost.httpAdapter as unknown as {
      getRequestUrl: (req: unknown) => string;
      reply: (res: unknown, body: unknown, statusCode: number) => void;
    };
    const ctx = host.switchToHttp();
    const path = String(httpAdapter.getRequestUrl(ctx.getRequest()));

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalError';
    let details: unknown[] | undefined;

    if (exception instanceof HttpException) {
      // Handle standard NestJS HTTP exceptions
      const response: unknown = exception.getResponse();
      statusCode = exception.getStatus();

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        // This handles class-validator errors specifically
        const res = response as { message?: string | string[]; error?: string };
        if (Array.isArray(res.message)) {
          details = res.message;
          message = res.message.join(', ');
        } else if (typeof res.message === 'string') {
          message = res.message;
        }
        error = res.error ?? 'HttpException';
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma database errors
      const prismaError = exception;
      switch (prismaError.code) {
        case 'P2002': {
          // Unique constraint failed
          statusCode = HttpStatus.CONFLICT;
          // The 'meta.target' contains the field(s) that caused the error
          const field = Array.isArray(prismaError.meta?.target)
            ? (prismaError.meta?.target as string[]).join(', ')
            : typeof prismaError.meta?.target === 'string'
              ? prismaError.meta?.target
              : JSON.stringify(prismaError.meta?.target ?? 'field');
          message = `A record with this ${field} already exists.`;
          error = 'Conflict';
          break;
        }
        case 'P2025': {
          // Record to update or delete not found
          statusCode = HttpStatus.NOT_FOUND;
          message = 'The requested resource was not found.';
          error = 'NotFound';
          break;
        }
        default: {
          // Handle other Prisma errors
          const stack = prismaError.stack ?? String(prismaError);
          this.logger.error(`Unhandled Prisma Error: ${prismaError.code}`, stack);
          message = 'A database error occurred.';
          error = 'DatabaseError';
          break;
        }
      }
    } else {
      // Handle all other unexpected errors
      if (exception instanceof Error) {
        this.logger.error('Unhandled Exception', exception.stack ?? exception.message);
        message = exception.message;
        error = exception.name;
      } else {
        this.logger.error('Unhandled Exception', String(exception));
        message = String(exception);
        error = 'UnhandledException';
      }
    }

    const responseBody = {
      statusCode,
      message,
      error,
      details, // Will only be present for validation errors
      path,
      timestamp: new Date().toISOString(),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
  }
}
