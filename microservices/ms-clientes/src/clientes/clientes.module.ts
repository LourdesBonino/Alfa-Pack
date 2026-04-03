import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importante para leer el .env
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';

@Module({
  imports: [ConfigModule], // Le damos permiso para usar la configuración
  controllers: [ClientesController], // Registramos la "puerta" (la API)
  providers: [ClientesService], // Registramos el "motor" (la lógica)
})
export class ClientesModule {}