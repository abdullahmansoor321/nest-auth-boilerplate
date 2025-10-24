import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { createWinstonOptions } from './config/winston.config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
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
  // Keep the old AllExceptionsFilter for backward compatibility logging
  app.useGlobalFilters(new AllExceptionsFilter());
  // Register the new GlobalExceptionFilter which needs the HttpAdapterHost
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));
  // Register global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());
  // Register global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Setup Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Boilerplate API')
    .setDescription('NestJS Boilerplate API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'bearer',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT') ?? 3000;
  await app.listen(port);
}

void bootstrap();
