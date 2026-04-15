# NestJS Secure Boilerplate

Production-oriented NestJS API boilerplate with JWT auth, refresh-token rotation, RBAC, Prisma (MongoDB), and hardened defaults.

## Features

- JWT access tokens + refresh-token rotation
- Refresh-token revocation (single-device and all-device logout)
- Role-based access control (USER/ADMIN)
- Prisma with MongoDB
- Security middleware: Helmet, CORS allowlist, throttling
- Request validation and response transformation
- Centralized exception handling

## Requirements

- Node.js 20+
- MongoDB

## Setup

```bash
npm install
```

Copy env values from [.env.example](.env.example) and set:

- DATABASE_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- CORS_ORIGINS (comma-separated origins, required for browser clients)
- NODE_ENV

## Database

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

## Run

```bash
# development
npm run start:dev

# production build + start
npm run build
npm run start:prod
```

## API Docs (Swagger)

Swagger is enabled when NODE_ENV is not production.

- Dev URL: http://localhost:3000/api

## Scripts

```bash
npm run lint
npm run test
npm run test:cov
npm run test:e2e
```

Note: in this push scope, e2e test suite files are excluded from the repository, and npm run test:e2e is a placeholder.

## Security Notes

- JWT strategy requires JWT_SECRET (no insecure fallback)
- Logout endpoint validates refresh-token ownership
- CORS is origin-allowlist based
- Production internal errors are sanitized

## Project Structure

- [src/main.ts](src/main.ts) app bootstrap/security config
- [src/modules/auth](src/modules/auth) auth, refresh, strategies
- [src/modules/user](src/modules/user) user module and repository
- [src/modules/admin](src/modules/admin) admin-only role operations
- [prisma/schema.prisma](prisma/schema.prisma) database schema
