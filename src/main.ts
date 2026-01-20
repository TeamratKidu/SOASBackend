import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';

import { json, urlencoded } from 'express';

// ... imports

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase payload size limit
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Enable CORS with credentials
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Cookie parser for JWT in HttpOnly cookies
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set global prefix for API routes
  // This will verify that all controller routes start with /api
  // e.g. /auctions -> /api/auctions
  app.setGlobalPrefix('api', {
    exclude: ['api/auth/(.*)'], // Exclude better-auth routes if necessary, though app.use handles them separately
  });

  // Mount Better Auth routes BEFORE other routes
  // This handles all /api/auth/* endpoints
  app.use('/api/auth', toNodeHandler(auth));

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('SOAS - Secure Online Auction System')
    .setDescription('API documentation for the Secure Online Auction System')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints (Better Auth)')
    .addTag('auctions', 'Auction management')
    .addTag('bids', 'Bidding operations')
    .addTag('payments', 'Payment processing')
    .addTag('admin', 'Admin operations')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 SOAS Backend running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔐 Better Auth: http://localhost:${port}/api/auth`);
}
bootstrap();
