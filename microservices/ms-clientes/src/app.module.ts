import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <--- Importá esto
import { ClientesModule} from './clientes/clientes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Esto hace que el .env se vea en todo el microservicio
    }),
    ClientesModule,
  ],
})
export class AppModule {}