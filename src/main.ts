import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { join } from 'path';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors'; 
import { RawServerDefault } from 'fastify';
import { AllExceptionsFilter } from './utils/all-exceptions.filter';
import { initializeTransactionalContext } from 'typeorm-transactional';

async function bootstrap(): Promise<void> {
  initializeTransactionalContext()
  
  const app: NestFastifyApplication<RawServerDefault> = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  
  await app.register(cors, {
    origin: 'http://127.0.0.1:3000', // ou '*'
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalFilters(new AllExceptionsFilter()); 

  app.enableVersioning({
    type: VersioningType.URI,
  });

  const config: Omit<OpenAPIObject, "paths"> = new DocumentBuilder()
    .setTitle('Blog simples em NestJS')
    .setDescription('API para um blog desenvolvido em NestJS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: Boolean(process.env.TRANSFORM), 
      whitelist: Boolean(process.env.WHITELIST), 
      forbidNonWhitelisted: Boolean(process.env.FORBIDNONWHITELISTED), 
    }),
  );

  await app.listen(4000, '0.0.0.0');
}

bootstrap();