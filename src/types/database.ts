export type CondicionPedido = 'entregar' | 'retirar' | 'contra_rembolso';
export type EstadoPedido = 'programado' | 'pendiente_retiro' | 'retirado' | 'en_viaje' | 'en_destino' | 'entregado' | 'en_proceso_de_reembolso' | 'en_viaje_reembolso' | 'finalizado_efectivo' | 'finalizado_cuenta_corriente' | 'finalizado_rendido' | 'cancelado' | 'pospuesto';

export interface Cliente {
    id: string;
    nombre_razon_social: string;
    dni_cuit: string | null;
    telefono: string | null;
    localidad: string | null;
    direccion: string | null;
    comision_porcentaje: number;
    cuenta_corriente: boolean;
    created_at?: string;
}

export type FormaCobro = 'origen' | 'destino' | 'cuenta_corriente' | 'cuenta_corriente_destino';

export interface Pedido {
    id: string;
    cliente_id: string;
    destinatario_id?: string | null;
    destinatario_nombre: string;
    condicion: CondicionPedido;
    estado: EstadoPedido;
    observaciones: string | null;
    precio_envio: number;
    valor_mercaderia: number;
    fecha_registro: string;
    fecha_ejecucion: string;
    abonado: boolean;
    monto_abonado?: number;
    retiro_en_sucursal: boolean;
    direccion_retiro?: string | null;
    entrega_en_oficina?: boolean;
    direccion_entrega?: string | null;
    forma_cobro: FormaCobro;
    cantidad_bultos: number;
    created_at?: string;
}