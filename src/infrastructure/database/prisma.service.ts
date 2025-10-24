import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this.logger.log('Connected to database.');
    } catch (err: unknown) {
      // If DB connection fails due to replica set expectations, attempt a development-friendly fallback
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Initial Prisma connect failed: ${message}`);

      const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';
      const rawUrl = process.env.DATABASE_URL ?? '';
      const fallbackUrl = rawUrl.replace('?replicaSet=rs0', '').replace('&replicaSet=rs0', '');

      if (isDev && rawUrl && fallbackUrl !== rawUrl) {
        try {
          this.logger.warn(
            'Attempting fallback DB connection without replicaSet (development mode)...',
          );

          // Temporarily override DATABASE_URL to let a newly-created PrismaClient connect to the fallback address.
          const originalDbUrl = process.env.DATABASE_URL;
          try {
            process.env.DATABASE_URL = fallbackUrl;
            const fallback = new PrismaClient();
            await fallback.$connect();

            // Copy properties from the fallback client onto this instance so existing code works unchanged.
            Object.assign(this, fallback);
          } finally {
            if (typeof originalDbUrl === 'undefined') delete process.env.DATABASE_URL;
            else process.env.DATABASE_URL = originalDbUrl;
          }
          this.logger.log('Fallback DB connection established.');
          return;
        } catch (fallbackErr: unknown) {
          const fallbackMsg =
            fallbackErr instanceof Error
              ? (fallbackErr.stack ?? fallbackErr.message)
              : String(fallbackErr);
          this.logger.error('Fallback DB connection failed.', fallbackMsg);
        }
      }

      // Re-throw the original error if fallback not possible or failed
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from database.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn('Error disconnecting Prisma client: ' + message);
    }
  }
}
