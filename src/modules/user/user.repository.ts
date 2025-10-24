import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Role } from '@prisma/client';
import { MongoClient } from 'mongodb';

// Reusable selection to ensure we never accidentally return the password hash
export const userSelect = {
  id: true,
  email: true,
  role: true,
  name: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: { email: string; password: string; name?: string; role?: string }) {
    try {
      // First, attempt the standard Prisma create
      const createInput = {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role as unknown as Role | undefined,
      };

      const created = await this.prisma.user.create({ data: createInput, select: userSelect });

      // Use debug so production logs stay clean
      this.logger.debug('Created user via Prisma client.');
      return created;
    } catch (err: unknown) {
      // Type-guard for objects that may have a `code` property (Prisma errors)
      const hasCode = typeof err === 'object' && err !== null && 'code' in err;
      if (hasCode && (err as { code?: string }).code === 'P2031') {
        this.logger.warn('Prisma create failed (P2031).');

        // Only allow native-driver fallback in non-production environments.
        const isProd = (process.env.NODE_ENV ?? 'development') === 'production';
        if (!isProd) {
          this.logger.warn('Falling back to native MongoDB driver for local development.');
          return this.createWithNativeDriver(data);
        }

        // In production, re-throw so upstream/GlobalExceptionFilter can surface the error
        throw err;
      }
      // If it's a different error, re-throw it
      throw err;
    }
  }

  private async createWithNativeDriver(data: {
    email: string;
    password: string;
    name?: string;
    role?: string;
  }) {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) throw new Error('DATABASE_URL is not set');

    // Remove replicaSet param for local fallback (handles ?replicaSet=... and &replicaSet=...)
    const fallbackUrl = rawUrl.replace(/[?&]replicaSet=[^&]+/, '');
    const client = new MongoClient(fallbackUrl);

    try {
      await client.connect();

      // Extract DB name from connection string (default to 'default' if not present)
      const parsed = new URL(fallbackUrl);
      const dbName = parsed.pathname.replace(/^\/+/, '') || 'default';

      const db = client.db(dbName);
      const collection = db.collection('User');

      // Add Prisma-like default fields
      const now = new Date();
      // Build a minimal document to insert via native driver (avoid assigning `any`)
      const documentToInsert: {
        email: string;
        password: string;
        name?: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
      } = {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role ?? 'USER',
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(documentToInsert);
      const createdDoc = await collection.findOne({ _id: result.insertedId });

      if (!createdDoc) throw new Error('Failed to retrieve user after native insert.');

      // Use debug here as well; this path should only trigger in development
      this.logger.debug('Created user via native MongoDB driver fallback.');

      type CreatedDoc = {
        _id?: unknown;
        email?: string;
        role?: string;
        name?: string;
        createdAt?: Date;
        updatedAt?: Date;
      };
      const doc = createdDoc as CreatedDoc;
      const idVal = doc._id;
      const idStr =
        typeof idVal === 'object' &&
        idVal !== null &&
        'toHexString' in (idVal as Record<string, unknown>) &&
        typeof (idVal as Record<string, unknown>)['toHexString'] === 'function'
          ? (idVal as { toHexString: () => string }).toHexString()
          : String(idVal);

      return {
        id: idStr,
        email: doc.email,
        role: doc.role,
        name: doc.name,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    } finally {
      await client.close();
    }
  }

  findByEmail(email: string) {
    // Intentionally do NOT apply `select` here because authentication
    // needs the password field for validation. Use this method carefully.
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: userSelect });
  }

  findAll() {
    return this.prisma.user.findMany({ select: userSelect });
  }
}
