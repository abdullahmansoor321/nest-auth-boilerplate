import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { createWinstonOptions } from './config/winston.config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = WinstonModule.createLogger(createWinstonOptions());
  const app = await NestFactory.create(AppModule, { logger });

  // Register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());
  // Register global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());
  // Register global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Setup Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Boilerplate API')
    .setDescription('NestJS Boilerplate API Documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT') ?? 3000;
  await app.listen(port);
}

void bootstrap();
