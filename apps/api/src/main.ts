import { NestFactory } from '@nestjs/core'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  const config = app.get(ConfigService)
  const isDev = config.get('NODE_ENV') !== 'production'

  // ── Security ─────────────────────────────────────────────────────────────
  app.use(helmet())
  app.enableCors({
    origin: config.get('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3001',
    credentials: true,
  })

  // ── API versioning ────────────────────────────────────────────────────────
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })
  app.setGlobalPrefix('api')

  // ── Validation ───────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  // ── Swagger (dev only) ───────────────────────────────────────────────────
  if (isDev) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AthleteOS API')
      .setDescription('Fitness intelligence platform — connects wearables, generates recommendations')
      .setVersion('1.0')
      .addBearerAuth()
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/docs', app, document)
    console.log(`📚 Swagger docs: http://localhost:3000/api/docs`)
  }

  const port = config.get<number>('PORT') ?? 3000
  await app.listen(port)
  console.log(`🚀 AthleteOS API running on port ${port}`)
}

bootstrap()
