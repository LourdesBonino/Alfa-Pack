import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ClientesService {
    private supabase: SupabaseClient;

    constructor() {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_KEY;
        if (!url || !key) throw new Error('Faltan credenciales en .env');
        this.supabase = createClient(url, key);
    }

    // --- MÉTODOS DE CLIENTES ---

    async listarTodos() {
        const { data, error } = await this.supabase
            .from('clientes')
            .select('*')
            .order('nombre_razon_social', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async buscarPorNombre(termino: string) {
        const { data, error } = await this.supabase
            .from('clientes')
            .select('*')
            .ilike('nombre_razon_social', `%${termino}%`)
            .limit(10);

        if (error) throw error;
        return data || [];
    }

    async crearCliente(cliente: any) {
        const { data, error } = await this.supabase
            .from('clientes')
            .insert([cliente])
            .select();

        if (error) throw error;
        return data ? data[0] : null; // Devolvemos el objeto creado directamente
    }

    async actualizarCliente(id: number, cambios: any) {
        // Quitamos el ID de los cambios para evitar errores de restricción
        const { id: _, ...datosAActualizar } = cambios;

        const { data, error } = await this.supabase
            .from('clientes')
            .update(datosAActualizar)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data ? data[0] : null;
    }

    async eliminarCliente(id: number) {
        const { error } = await this.supabase
            .from('clientes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { deleted: true, id };
    }

    // --- MÉTODOS DE ENVÍOS ---

    async registrarEnvio(envio: any) {
        const { data, error } = await this.supabase
            .from('envios')
            .insert([{ 
                cliente_id: envio.cliente_id, 
                camino: envio.camino,
                bultos: envio.bultos, 
                precio: envio.precio,
                observaciones: envio.observaciones,
                fecha: envio.fecha, 
                forma_pago: envio.forma_pago,
                direccion_destino: envio.direccion_destino,
                destinatario: envio.destinatario,
                estado: 'pendiente'
            }])
            .select();

        if (error) throw error;
        return data ? data[0] : null;
    }
    // En clientes.service.ts
async buscarCliente(termino: string) {
    // Usamos ilike para que no importe si es mayúscula o minúscula
    const { data, error } = await this.supabase
        .from('clientes')
        .select('*')
        .ilike('nombre_razon_social', `%${termino}%`); 

    if (error) throw error;
    return data;
}
}