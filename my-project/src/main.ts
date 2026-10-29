import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Hotel Booking System API')
    .setDescription(
    [
      'API for managing Room and Booking management.',
      '',
      'Rate limiting:',
      '- 100 requests per minute per access token.',
      '- Exceeding the limit returns 429 Too Many Requests with a standard error body.',
    ].join('\n'),
  )
    .setVersion('1.0.0')
    .addTag('rooms')
    .addTag('bookings')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Use: Authorization: Bearer <access_token>',
        in: 'header',
      },
      'access-token', // Security name used in decorators
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
