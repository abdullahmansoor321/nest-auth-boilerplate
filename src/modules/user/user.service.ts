import { Injectable, ConflictException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(data: CreateUserDto) {
    // Application-layer check: look for existing user by email first
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      // Fast, friendly response when the email is already taken
      throw new ConflictException('A user with this email already exists.');
    }

    // Hash the password and proceed to create. Keep the DB-level
    // duplicate check (catching P2002) to handle any race conditions.
    const hashed = await bcrypt.hash(data.password, 10);
    // Ensure payload matches the repository's expected shape
    // Prisma `User` model may include nullable fields (e.g. name: string | null).
    // Our repository expects optional fields to be `undefined` when absent, not `null`.
    // Normalize `name` from `null` -> `undefined` and build a narrow payload type.
    const payload = {
      email: data.email,
      password: hashed,
      // convert null to undefined so it matches repository expectations
      ...(data.name != null ? { name: data.name } : {}),
    } as { email: string; password: string; name?: string };
    try {
      return await this.userRepository.create(payload);
    } catch (error: unknown) {
      // Prisma duplicate unique constraint error code
      const hasCode = typeof error === 'object' && error !== null && 'code' in error;
      if (hasCode && (error as { code?: string }).code === 'P2002') {
        throw new ConflictException('A user with this email already exists.');
      }
      throw error;
    }
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  findOne(id: string) {
    return this.userRepository.findById(id);
  }

  findAll() {
    return this.userRepository.findAll();
  }

  // findAll intentionally removed — user management endpoints are
  // not exposed publicly in this application. This keeps the
  // authentication module focused and reduces API surface.
}
