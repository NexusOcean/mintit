import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { writeFileSync } from 'fs';
import { join } from 'path';

const isProd = process.env.NODE_ENV === 'production';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log'],
  });

  app.use(helmet());
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.setGlobalPrefix('v1', { exclude: ['/'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.enableShutdownHooks();

  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Payments API')
      .setDescription('REST API for payment processor')
      .setVersion('0.1.0')
      .addApiKey({ type: 'apiKey', name: 'X-Api-Key', in: 'header' }, 'api-key')
      .addApiKey(
        { type: 'apiKey', name: 'X-Admin-Api-Key', in: 'header' },
        'admin-key',
      )
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    writeFileSync(
      join(process.cwd(), 'docs', 'swagger.json'),
      JSON.stringify(document, null, 2),
    );
  }

  await app.listen(3000);
  if (!isProd) {
    console.log('Swagger docs: http://localhost:3000/docs');
    console.log(`Listening on: http://localhost:5173`);
  }
}

void bootstrap();
