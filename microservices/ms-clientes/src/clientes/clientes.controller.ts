import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { ClientesService } from './clientes.service';

@Controller('clientes')
export class ClientesController {
    constructor(private readonly clientesService: ClientesService) {}

    // --- RUTAS DE CONSULTA ---

    @Get() // GET /clientes
    listar() {
        return this.clientesService.listarTodos();
    }

    // Importante: 'buscar' va ANTES de ':id' para que NestJS no crea que 'buscar' es un ID
    @Get('buscar') // GET /clientes/buscar?termino=...
    buscar(@Query('termino') termino: string) {
        return this.clientesService.buscarCliente(termino);
    }

    // --- RUTAS DE GESTIÓN (ID) ---

    @Get(':id/resumen')
    obtenerResumen(
        @Param('id') id: string, // Lo dejamos como string (UUID)
        @Query('mes') mes: string,
        @Query('anio') anio: string
    ) {
        // Solo convertimos a número el Mes y el Año
        const mesNum = parseInt(mes, 10);
        const anioNum = parseInt(anio, 10);

        // IMPORTANTE: No usamos +id aquí
        return this.clientesService.obtenerEnviosResumen(id, mesNum, anioNum);
    }

    // --- RUTAS DE ESCRITURA (POST/PATCH/DELETE) ---

    @Post() // POST /clientes (Crear nuevo)
    crear(@Body() cliente: any) {
        return this.clientesService.crearCliente(cliente);
    }

    @Patch(':id') // PATCH /clientes/123 (Editar u Ocultar)
    actualizar(@Param('id') id: string, @Body() cambios: any) {
        return this.clientesService.actualizarCliente(id, cambios);
    }

    @Delete(':id') // DELETE /clientes/123 (Borrado físico)
    eliminar(@Param('id') id: string) {
        return this.clientesService.eliminarCliente(id);
    }

    // --- RUTAS DE ENVÍOS ---

    @Post('envio') // POST /clientes/envio
    registrarEnvio(@Body() envio: any) {
        return this.clientesService.registrarEnvio(envio);
    }
}