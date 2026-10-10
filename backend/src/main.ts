import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validates every @InputType using the class-validator rules (whitelist drops unknown fields).
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS: only our frontend may call the API from a browser.
  app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://campus-eats-snowy.vercel.app',
  ],
  credentials: true,
});

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`API ready: http://localhost:${port}/graphql`);
}
bootstrap();
