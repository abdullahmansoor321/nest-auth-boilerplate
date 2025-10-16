import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { createWinstonOptions } from './config/winston.config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = WinstonModule.createLogger(createWinstonOptions());
  const app = await NestFactory.create(AppModule, { logger });

  // Register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());
  // Register global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT') ?? 3000;
  await app.listen(port);
}

void bootstrap();
