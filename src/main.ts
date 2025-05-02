import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { join } from 'path';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors'; 
import { RawServerDefault } from 'fastify';

async function bootstrap(): Promise<void> {
  const app: NestFastifyApplication<RawServerDefault> = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  
  await app.register(cors, {
    origin: 'http://127.0.0.1:3000', // ou '*'
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(4000, '0.0.0.0');
}

bootstrap();