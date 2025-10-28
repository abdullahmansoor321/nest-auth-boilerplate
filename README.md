<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

A **production-ready NestJS boilerplate** featuring JWT authentication with refresh token rotation, MongoDB with Prisma ORM, role-based access control, and comprehensive security features.

### ✨ Key Features

- ✅ **JWT Authentication** with refresh token rotation & server-side revocation
- ✅ **Role-Based Access Control (RBAC)** with custom guards
- ✅ **MongoDB + Prisma ORM** with replica set fallback support
- ✅ **Security Best Practices** (Helmet, CORS, rate limiting)
- ✅ **Code Quality Tools** (ESLint, Prettier, Husky pre-commit hooks)
- ✅ **API Documentation** (Swagger/OpenAPI at `/api`)
- ✅ **Centralized Logging** (Winston)
- ✅ **Global Exception Handling** with Prisma error mapping
- ✅ **Validation & Transformation** pipelines

## Project setup

```bash
npm install
```

All environment variables are validated at runtime using Joi (see `src/config/validation.ts`). See `.env.example` for the recommended variable names.

### Database Setup

This project uses **Prisma** with **MongoDB**. The schema includes `User` and `RefreshToken` models.

```bash
# Apply schema to database (MongoDB - no migrations needed)
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed database with sample users
npx prisma db seed
```

**Note:** For production, MongoDB should run in replica set mode. This boilerplate includes fallback mechanisms for standalone MongoDB during development.

## Compile and run the project

```bash
# development (watch mode)
npm run start:dev

# production mode
npm run start:prod

# debug mode
npm run start:debug
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

### API Documentation

Once running, visit `http://localhost:3000/api` for interactive Swagger documentation.

## Run tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov

# validation tests
npm run test:validation

# quick smoke tests
npm run check:e2e
```

## 🔐 Authentication & Authorization

### Authentication Flow

This boilerplate implements a secure JWT + Refresh Token authentication system:

**Login Flow:**
1. `POST /auth/login` - User provides email/password
2. Server validates credentials via `LocalStrategy`
3. Returns short-lived JWT access token (15 min) + long-lived refresh token (7 days)
4. Refresh token is stored in database for server-side revocation

**Token Refresh:**
- `POST /auth/refresh` - Validates refresh token from database
- Issues new access token and rotates refresh token (old deleted, new created)
- Prevents replay attacks through token rotation

**Logout:**
- `POST /auth/logout` - Deletes specific refresh token (single device logout)
- `POST /auth/logout-all` - Deletes all user's refresh tokens (multi-device logout)

### Key Files

- `src/modules/auth/auth.controller.ts` - Auth endpoints
- `src/modules/auth/auth.service.ts` - Business logic (login, refresh, logout)
- `src/modules/auth/refresh-token.service.ts` - Token storage & validation
- `src/modules/auth/strategies/jwt.strategy.ts` - JWT validation
- `src/modules/auth/strategies/local.strategy.ts` - Login validation
- `prisma/schema.prisma` - User & RefreshToken models

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Create new user |
| POST | `/auth/login` | ❌ | Login & get tokens |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ✅ JWT | Logout (revoke token) |
| POST | `/auth/logout-all` | ✅ JWT | Logout all devices |
| GET | `/users/me` | ✅ JWT | Get current user |
| GET | `/users` | ✅ JWT + Admin | List all users |

## 🛡️ Security Features

- **Helmet** - Security headers (CSP, X-Frame-Options, etc.)
- **CORS** - Configured with proper origin controls
- **Rate Limiting** - 10 requests/60 seconds per IP (via `@nestjs/throttler`)
- **Password Hashing** - bcrypt with 10 rounds
- **JWT Tokens** - Short-lived (15 min), cryptographically signed
- **Refresh Tokens** - Long-lived (7 days), database-backed, revocable
- **Token Rotation** - New refresh token issued on each refresh
- **Input Validation** - All DTOs validated with `class-validator`
- **Error Sanitization** - Prisma errors mapped to safe HTTP responses

## 📊 Database Schema

### User Model
```prisma
model User {
  id            String         @id @default(auto()) @map("_id") @db.ObjectId
  email         String         @unique
  role          Role           @default(USER)
  name          String?
  password      String         // bcrypt hashed
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  refreshTokens RefreshToken[]
}
```

### RefreshToken Model
```prisma
model RefreshToken {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  token     String   @unique
  userId    String   @db.ObjectId
  expiresAt DateTime  // 7 days from creation
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([expiresAt])
}
```

## 🛠️ Development Tools

### Code Quality
- **ESLint** - Linting with auto-fix
- **Prettier** - Code formatting
- **Husky** - Git pre-commit hooks (runs lint & format)

### Logging
- **Winston** - Structured logging with custom formatters
- **Request Logger** - HTTP request/response logging middleware

### Database Tools
```bash
# Open Prisma Studio (GUI)
npx prisma studio

# View generated Prisma Client
npx prisma generate --help
```

## 📁 Project Structure

```
src/
├── common/              # Shared utilities
│   ├── decorators/      # Custom decorators (@Roles, etc.)
│   ├── filters/         # Global exception filter
│   ├── guards/          # Auth guards (JWT, Local, Roles)
│   ├── interceptors/    # Response transformation
│   └── middleware/      # Request logger
├── config/              # Configuration
│   ├── validation.ts    # Env variable validation
│   └── winston.config.ts
├── infrastructure/      # External services
│   └── database/        # Prisma service
├── modules/
│   ├── auth/            # Authentication module
│   │   ├── strategies/  # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── refresh-token.service.ts
│   └── user/            # User module
│       ├── dto/
│       ├── user.controller.ts
│       ├── user.service.ts
│       └── user.repository.ts
├── app.module.ts
└── main.ts              # Application entry point
```

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Run production server
npm run start:prod
```

### Production Checklist

✅ Set `NODE_ENV=production`
✅ Use strong `JWT_SECRET` (min 32 characters)
✅ Run MongoDB in replica set mode
✅ Enable HTTPS/TLS
✅ Configure proper CORS origins
✅ Set up monitoring & logging
✅ Regular database backups
✅ Implement token cleanup cron (see below)

### Token Cleanup

Expired refresh tokens are automatically deleted when accessed. For proactive cleanup:

```typescript
// Optional: Add @nestjs/schedule and create a cron service
@Cron('0 2 * * *') // Daily at 2 AM
async cleanupTokens() {
  await this.refreshTokenService.cleanupExpiredTokens();
}
```

## 📚 Additional Documentation

- `BUILD_PLAN.md` - Architecture & development roadmap
- `REFRESH_TOKEN_AUTH.md` - Detailed auth flow documentation
- `TEST_AUTH.md` - Authentication testing guide
- `SECURITY.md` - Security features explained
- `scripts/README.md` - Helper scripts documentation

## 🎯 Design Patterns

This boilerplate implements industry-standard patterns:

1. **Dependency Injection** - Constructor-based IoC
2. **Module Pattern** - Feature-based modules
3. **Repository Pattern** - Data access abstraction
4. **Strategy Pattern** - Passport authentication strategies
5. **DTO Pattern** - Input validation & type safety
6. **Guard Pattern** - Route protection
7. **Decorator Pattern** - Custom metadata decorators
8. **Interceptor Pattern** - Response transformation
9. **Filter Pattern** - Global exception handling

## 💡 Developer Tips

### Windows Users

If `prisma generate` fails with EPERM error:
```bash
# Stop all Node processes
Get-Process node | Stop-Process -Force

# Then regenerate
npx prisma generate
```

### Schema Changes

After modifying `prisma/schema.prisma`:
```bash
npx prisma db push
npx prisma generate
# Restart dev server to load new types
```

## 🌟 What Makes This Boilerplate Special

1. **MongoDB Replica Set Fallback** - Works with standalone MongoDB in dev
2. **Token Rotation** - Industry-standard refresh token security
3. **Prisma Error Mapping** - User-friendly error messages
4. **Multi-Device Logout** - Revoke all sessions at once
5. **Type-Safe** - Full TypeScript strict mode
6. **Production-Ready** - All security best practices included
7. **Well-Tested** - Unit + E2E + validation tests
8. **Documented** - Extensive inline comments & docs

## MongoDB / Prisma note

For full Prisma compatibility, a MongoDB replica set is recommended (required for transactions). In production you should run MongoDB in replica set mode.

This boilerplate includes development fallbacks so the app can start and function on a standalone MongoDB instance. If the Prisma client needs transactions and your MongoDB is not a replica set, write operations may fall back to a native MongoDB driver insert for local development.

If you want the full, production-like behavior locally, run MongoDB as a replica set (for example via Docker Compose or by starting mongod with --replSet and initializing the replica set).

## 📖 Resources

### NestJS Resources

- [NestJS Documentation](https://docs.nestjs.com) - Official docs
- [NestJS Discord](https://discord.gg/G7Qnnhy) - Community support
- [NestJS Courses](https://courses.nestjs.com/) - Video tutorials

### This Boilerplate

- View interactive API docs at `/api` when server is running
- Check `scripts/` folder for testing utilities
- See `REFRESH_TOKEN_AUTH.md` for auth flow details

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is MIT licensed.

---

**Built with** ❤️ **using NestJS 11.x + Prisma 6.x + MongoDB**

**Last Updated:** October 2025
