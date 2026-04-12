import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ClientesService {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    if (!url || !key) throw new Error('Faltan credenciales de Supabase en .env');
    this.supabase = createClient(url, key);
  }

  // --- MÉTODOS DE CLIENTES ---

  async listarTodos() {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .eq('activo', true) // <-- CORRECCIÓN: Solo trae los que no están ocultos
      .order('nombre_razon_social', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async buscarCliente(termino: string) {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .eq('activo', true) // <-- CORRECCIÓN: Buscar solo entre los activos
      .ilike('nombre_razon_social', `%${termino}%`);

    if (error) throw error;
    return data || [];
  }

  // --- CREAR CLIENTE ---
  async crearCliente(cliente: any) {
    const { id, ...datosSinId } = cliente; 

    const { data, error } = await this.supabase
      .from('clientes')
      .insert([{
        nombre_razon_social: datosSinId.nombre_razon_social,
        dni_cuit: datosSinId.dni_cuit,
        direccion: datosSinId.direccion,
        localidad: datosSinId.localidad || 'General Deheza',
        telefono: datosSinId.telefono,
        activo: true
      }])
      .select();

    if (error) {
      console.error('Error al REGISTRAR en Supabase:', error.message);
      throw error;
    }
    return data ? data[0] : null;
  }

  // --- ACTUALIZAR CLIENTE ---
  async actualizarCliente(id: string, cambios: any) {
    console.log('Intentando actualizar ID:', id, 'con datos:', cambios);
    
    const { id: _, ...datosAActualizar } = cambios;

    const { data, error } = await this.supabase
      .from('clientes')
      .update({
        nombre_razon_social: datosAActualizar.nombre_razon_social,
        dni_cuit: datosAActualizar.dni_cuit,
        direccion: datosAActualizar.direccion,
        localidad: datosAActualizar.localidad,
        telefono: datosAActualizar.telefono,
        activo: datosAActualizar.activo !== undefined ? datosAActualizar.activo : true // <-- CORRECCIÓN: Permite cambiar el estado activo/inactivo
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error al ACTUALIZAR en Supabase:', error.message);
      throw error;
    }
    return data ? data[0] : null;
  }

  async eliminarCliente(id: string) {
    const { error } = await this.supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { deleted: true, id };
  }

  // --- MÉTODOS DE PEDIDOS / ENVÍOS ---

  async obtenerEnviosResumen(clienteId: string, mes: number, anio: number) {
    const inicio = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 0); 

    const fechaInicio = inicio.toISOString().split('T')[0];
    const fechaFin = fin.toISOString().split('T')[0];

    console.log(`Rango corregido para Alfa Pack: ${fechaInicio} al ${fechaFin}`);

    const { data, error } = await this.supabase
      .from('pedidos')
      .select('*')
      .eq('id_cliente', clienteId)
      .gte('fecha_servicio', fechaInicio)
      .lte('fecha_servicio', fechaFin)
      .order('fecha_servicio', { ascending: true });
            
    if (error) throw error;
    return data || [];
  }

  async registrarEnvio(envio: any) {
    console.log('Datos que vienen del Front:', envio);

    const { data, error } = await this.supabase
      .from('pedidos') 
      .insert([{ 
        id_cliente: envio.cliente_id || envio.id_cliente, 
        tipo_camino: envio.tipo_recorrido || envio.camino || 'Camino A - Destino', 
        destinatario: envio.persona_destino || envio.destinatario || 'No especificado',
        direccion_destino: envio.direccion_entrega || envio.direccion_destino || 'No especificada',
        bultos: parseInt(envio.bultos) || 1, 
        precio_envio: parseFloat(envio.precio) || 0,
        fecha_servicio: envio.fecha_recorrido || envio.fecha || new Date(),
        forma_pago: envio.forma_pago || 'Efectivo',
        observaciones: envio.observaciones || '',
        estado_pedido: 'pendiente'
      }])
      .select();

    if (error) {
      console.error('ERROR REAL DE SUPABASE:', error.message);
      throw error;
    }
    return data ? data[0] : null;
  }
}