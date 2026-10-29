import 'reflect-metadata';
import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

@Controller()
class AppController {
  @Get()
  home() {
    return { message: process.env.APP_MESSAGE || 'Hello from local NestJS', lab: 111 };
  }

  @Get('health')
  health() {
    return { status: 'ok', environment: process.env.NODE_ENV || 'development' };
  }
}

@Module({ controllers: [AppController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`Lab 11 API listening on port ${port}`);
}
bootstrap().catch((error) => { console.error(error); process.exit(1); });
