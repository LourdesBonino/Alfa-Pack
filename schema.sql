-- ==========================================
-- Esquema de Base de Datos para Alfa Pack
-- Ejecutar en el SQL Editor del nuevo proyecto de Supabase
-- ==========================================

-- Habilitar extensión para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_razon_social TEXT NOT NULL,
    dni_cuit TEXT,
    telefono TEXT,
    localidad TEXT,
    direccion TEXT,
    comision_porcentaje NUMERIC(5,2) DEFAULT 0,
    cuenta_corriente BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabla de Pedidos (Operaciones Logísticas)
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
    destinatario_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    destinatario_nombre TEXT NOT NULL,
    
    condicion TEXT NOT NULL CHECK (condicion IN ('entregar', 'retirar', 'contra_rembolso')),
    
    estado TEXT NOT NULL DEFAULT 'programado' CHECK (estado IN (
        'programado', 'pendiente_retiro', 'retirado', 'en_viaje', 'en_destino', 
        'entregado', 'en_proceso_de_reembolso', 'en_viaje_reembolso', 
        'finalizado_efectivo', 'finalizado_cuenta_corriente', 'finalizado_rendido', 
        'cancelado', 'pospuesto'
    )),
    
    observaciones TEXT,
    precio_envio NUMERIC(10,2) DEFAULT 0 NOT NULL,
    valor_mercaderia NUMERIC(10,2) DEFAULT 0,
    
    fecha_registro DATE DEFAULT CURRENT_DATE NOT NULL,
    fecha_ejecucion DATE DEFAULT CURRENT_DATE NOT NULL,
    
    abonado BOOLEAN DEFAULT false NOT NULL,
    monto_abonado NUMERIC(10,2) DEFAULT 0 NOT NULL,
    
    retiro_en_sucursal BOOLEAN DEFAULT false NOT NULL,
    direccion_retiro TEXT,
    entrega_en_oficina BOOLEAN DEFAULT false NOT NULL,
    direccion_entrega TEXT,
    
    forma_cobro TEXT DEFAULT 'origen' NOT NULL CHECK (forma_cobro IN ('origen', 'destino', 'cuenta_corriente', 'cuenta_corriente_destino')),
    cantidad_bultos INTEGER DEFAULT 1 NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Row Level Security (Políticas abiertas temporalmente para desarrollo)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo en clientes" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Permitir todo en pedidos" ON public.pedidos FOR ALL USING (true);
