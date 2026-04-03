import * as dotenv from 'dotenv';
dotenv.config(); // Esto carga el archivo .env apenas arranca el motor de tu Asus

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Habilitamos CORS para que el Angular (4200) pueda hablar con este microservicio (3001)
  app.enableCors(); 
  await app.listen(3001);
  console.log('Microservicio Clientes de Alfa Pack corriendo en puerto 3001');
}
bootstrap();