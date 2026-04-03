import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ClientesService } from './clientes.service';

@Controller('clientes')
export class ClientesController {
    constructor(private readonly clientesService: ClientesService) {}

    // 1. AGREGAMOS LA RUTA DE BÚSQUEDA (VITAL)
    // Esto habilita: GET /clientes/buscar?termino=...
    @Get('buscar') 
    buscar(@Query('termino') termino: string) {
        return this.clientesService.buscarCliente(termino);
    }

    @Get() // GET /clientes
    listar() {
        return this.clientesService.listarTodos();
    }

    @Post() // POST /clientes
    crear(@Body() cliente: any) {
        return this.clientesService.crearCliente(cliente);
    }

    @Patch(':id') // PATCH /clientes/123
    actualizar(@Param('id') id: string, @Body() cambios: any) {
        return this.clientesService.actualizarCliente(+id, cambios);
    }

    @Delete(':id') // DELETE /clientes/123
    eliminar(@Param('id') id: string) {
        return this.clientesService.eliminarCliente(+id);
    }

    @Post('envio') // POST /clientes/envio
    registrarEnvio(@Body() envio: any) {
        return this.clientesService.registrarEnvio(envio);
    }
}