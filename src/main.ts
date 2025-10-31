import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { createWinstonOptions } from './config/winston.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const logger = WinstonModule.createLogger(createWinstonOptions());
  const app = await NestFactory.create(AppModule, { logger });

  // Apply Helmet security middleware
  app.use(helmet());

  // Enable CORS and allow Authorization header so browser-based
  // Swagger UI can send Bearer tokens in requests.
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    credentials: true,
  });

  // Register global exception filters
  // Register the new GlobalExceptionFilter which needs the HttpAdapterHost
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));
  // Register global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());
  // Register global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Setup Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('NestJS Boilerplate API')
    .setDescription(
      `NestJS Boilerplate API Documentation
      
**Authentication Flow:**
- Login with email/password to receive JWT access token and refresh token
- Access token expires in 15 minutes
- Refresh token expires in 7 days (stored in database for revocation)

**JWT Payload Structure:**
\`\`\`json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "USER" | "ADMIN",
  "iat": 1234567890,
  "exp": 1234568790
}
\`\`\`

**Role-Based Access Control:**
- \`USER\`: Standard user access (default for new registrations)
- \`ADMIN\`: Full access including user management

**Security Features:**
- JWT authentication with role-based authorization
- Refresh token rotation on each refresh
- Database-backed token revocation
- Helmet security headers
- CORS protection
- Request validation and sanitization
- Audit logging for admin actions

**Admin Operations:**
- All admin endpoints require \`ADMIN\` role
- **Role Management Security:**
  - Self-demotion prevention: Admins cannot demote themselves
  - Last admin protection: System ensures at least one admin always exists
  - Token invalidation: All user sessions terminated on role change
  - Flexible protection: Any admin can be demoted as long as another exists
- Role changes are logged with admin ID, target user ID, and timestamp
- All changes trigger forced re-login to apply new JWT with updated role
      `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description:
          'Enter JWT token (obtained from /auth/login). Token includes user role in payload for optimized authorization.',
        in: 'header',
      },
      'bearer',
    )
    .addTag('auth', 'Authentication endpoints - Login, register, refresh, logout')
    .addTag('users', 'User management endpoints - Profile and user data')
    .addTag('admin', 'Admin-only endpoints - User role management (requires ADMIN role)')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT') ?? 3000;
  await app.listen(port);
}

void bootstrap();
