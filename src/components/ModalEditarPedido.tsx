import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Pedido, FormaCobro, CondicionPedido, EstadoPedido, Cliente } from '../types/database';

interface Props {
    pedido: Pedido & { clientes?: Cliente | null };
    onClose: () =>void;
    onGuardado: () =>void;
}

export const ModalEditarPedido = ({ pedido, onClose, onGuardado }: Props) =>{
    const [destinatario, setDestinatario] = useState(pedido.destinatario_nombre || '');
    const [precioEnvio, setPrecioEnvio] = useState(pedido.precio_envio || 0);
    const [valorMercaderia, setValorMercaderia] = useState(pedido.valor_mercaderia || 0);
    const [formaCobro, setFormaCobro] = useState<FormaCobro>(pedido.forma_cobro);
    const [condicion, setCondicion] = useState<CondicionPedido>(pedido.condicion);
    const [fechaEjecucion, setFechaEjecucion] = useState(pedido.fecha_ejecucion || '');
    const [estado, setEstado] = useState<EstadoPedido>(pedido.estado);
    const [abonado, setAbonado] = useState(pedido.abonado || false);
    const [montoAbonado, setMontoAbonado] = useState(pedido.monto_abonado || 0);
    const [cantidadBultos, setCantidadBultos] = useState(pedido.cantidad_bultos || 1);
    const [observaciones, setObservaciones] = useState(pedido.observaciones || '');
    const [retiroEnSucursal, setRetiroEnSucursal] = useState(pedido.retiro_en_sucursal || false);
    const [direccionRetiro, setDireccionRetiro] = useState(pedido.direccion_retiro || '');
    const [entregaEnOficina, setEntregaEnOficina] = useState(pedido.entrega_en_oficina || false);
    const [direccionEntrega, setDireccionEntrega] = useState(pedido.direccion_entrega || '');
    const [cargando, setCargando] = useState(false);

    useEffect(() =>{
        if (pedido.clientes?.comision_porcentaje) {
            const calculado = valorMercaderia * (pedido.clientes.comision_porcentaje / 100);
            setPrecioEnvio(Number(calculado.toFixed(2)));
        }
    }, [valorMercaderia, pedido.clientes]);

    const guardar = async (e: React.FormEvent) =>{
        e.preventDefault();
        setCargando(true);

        const updates: Partial<Pedido>= {
            destinatario_nombre: destinatario,
            precio_envio: precioEnvio,
            valor_mercaderia: valorMercaderia,
            forma_cobro: formaCobro,
            condicion: condicion,
            fecha_ejecucion: fechaEjecucion,
            estado: estado,
            abonado: abonado,
            monto_abonado: abonado ? precioEnvio : 0,
            cantidad_bultos: cantidadBultos,
            observaciones: observaciones,
            retiro_en_sucursal: condicion !== 'entregar' ? retiroEnSucursal : false,
            direccion_retiro: (condicion !== 'entregar' && !retiroEnSucursal) ? direccionRetiro : null,
            entrega_en_oficina: entregaEnOficina,
            direccion_entrega: entregaEnOficina ? null : direccionEntrega,
        };

        const { error } = await supabase.from('pedidos').update(updates).eq('id', pedido.id);

        setCargando(false);

        if (error) {
            alert("Error al actualizar: " + error.message);
        } else {
            onGuardado();
            onClose();
        }
    };

    return (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"><div className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-2xl relative overflow-y-auto max-h-[95vh]"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black text-slate-800">️ Editar Pedido Completo</h2><button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div><form onSubmit={guardar} className="flex flex-col gap-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Destinatario / Para</label><input 
                                type="text" 
                                required
                                value={destinatario}
                                onChange={(e) =>setDestinatario(e.target.value)}
                                className="brand-input px-3 py-2 rounded-lg w-full font-semibold"
                            /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Fecha de Ejecución</label><input 
                                type="date" 
                                required
                                value={fechaEjecucion}
                                onChange={(e) =>setFechaEjecucion(e.target.value)}
                                className="brand-input px-3 py-2 rounded-lg w-full font-semibold"
                            /></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Costo Envío ($)</label><input 
                                type="number" 
                                step="0.01"
                                min="0"
                                required
                                value={precioEnvio}
                                onChange={(e) =>setPrecioEnvio(Number(e.target.value))}
                                className="brand-input px-3 py-2 rounded-lg w-full font-semibold"
                            /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Mercadería ($)</label><input 
                                type="number" 
                                step="0.01"
                                min="0"
                                value={valorMercaderia}
                                onChange={(e) =>setValorMercaderia(Number(e.target.value))}
                                className="brand-input px-3 py-2 rounded-lg w-full font-semibold"
                            /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Bultos</label><input 
                                type="number" 
                                min="1"
                                required
                                value={cantidadBultos}
                                onChange={(e) =>setCantidadBultos(Number(e.target.value))}
                                className="brand-input px-3 py-2 rounded-lg w-full font-semibold"
                            /></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Condición</label><select 
                                value={condicion}
                                onChange={(e) =>setCondicion(e.target.value as CondicionPedido)}
                                className="brand-input px-3 py-2 rounded-lg w-full font-semibold"
                            ><option value="entregar">Entregar</option><option value="retirar">Retirar</option><option value="contra_rembolso">Contra Reembolso</option></select></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Forma de Cobro</label><select 
                                value={formaCobro}
                                onChange={(e) =>setFormaCobro(e.target.value as FormaCobro)}
                                className="brand-input px-3 py-2 rounded-lg w-full font-semibold"
                            ><option value="origen">Origen</option><option value="destino">Destino</option><option value="cuenta_corriente">Cuenta Corriente (Origen)</option><option value="cuenta_corriente_destino">Cuenta Corriente (Destino)</option></select></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Estado del Pedido</label><select 
                                value={estado}
                                onChange={(e) =>setEstado(e.target.value as EstadoPedido)}
                                className="brand-input px-3 py-2 rounded-lg w-full font-semibold"
                            ><option value="programado">Programado</option><option value="pendiente_retiro">Pendiente de Retiro</option><option value="retirado">Retirado</option><option value="en_viaje">En Viaje</option><option value="en_destino">En Destino</option><option value="entregado">Entregado</option><option value="en_proceso_de_reembolso">En Proceso Reembolso</option><option value="en_viaje_reembolso">En Viaje Reembolso</option><option value="finalizado_efectivo">Finalizado (Efectivo)</option><option value="finalizado_cuenta_corriente">Finalizado (Cta Cte)</option><option value="finalizado_rendido">Finalizado (Rendido)</option><option value="cancelado">Cancelado</option><option value="pospuesto">Pospuesto</option></select></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Pagado en su totalidad</label><select 
                                value={abonado ? 'si' : 'no'}
                                onChange={(e) =>setAbonado(e.target.value === 'si')}
                                className="brand-input px-3 py-2 rounded-lg w-full font-semibold"
                            ><option value="no">No (Pendiente/Deuda)</option><option value="si">Sí (Abonado)</option></select></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Monto Abonado ($)</label><input 
                                type="number" 
                                step="0.01"
                                min="0"
                                value={montoAbonado}
                                onChange={(e) =>setMontoAbonado(Number(e.target.value))}
                                className="brand-input px-3 py-2 rounded-lg w-full font-semibold"
                            /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{condicion !== 'entregar' && (<div className="bg-slate-50 p-3 rounded-xl border border-slate-200"><label className="flex items-center gap-2 mb-2 font-bold text-sm text-slate-700"><input 
                                        type="checkbox" 
                                        checked={retiroEnSucursal}
                                        onChange={(e) =>setRetiroEnSucursal(e.target.checked)}
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-600"
                                    />El remitente lo acerca a sucursal</label>{!retiroEnSucursal && (<input 
                                        type="text"
                                        placeholder="Dirección de retiro exacta..."
                                        value={direccionRetiro}
                                        onChange={(e) =>setDireccionRetiro(e.target.value)}
                                        className="brand-input px-3 py-2 rounded w-full text-sm"
                                    />)}</div>)}<div className="bg-slate-50 p-3 rounded-xl border border-slate-200"><label className="flex items-center gap-2 mb-2 font-bold text-sm text-slate-700"><input 
                                    type="checkbox" 
                                    checked={entregaEnOficina}
                                    onChange={(e) =>setEntregaEnOficina(e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600"
                                />Se retira el bulto por sucursal</label>{!entregaEnOficina && (<input 
                                    type="text"
                                    placeholder="Dirección de entrega..."
                                    value={direccionEntrega}
                                    onChange={(e) =>setDireccionEntrega(e.target.value)}
                                    className="brand-input px-3 py-2 rounded w-full text-sm"
                                />)}</div></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Observaciones</label><textarea 
                            value={observaciones}
                            onChange={(e) =>setObservaciones(e.target.value)}
                            placeholder="Aclaraciones, franjas horarias..."
                            className="brand-input px-3 py-2 rounded-lg w-full font-semibold min-h-[80px]"
                        /></div><div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button><button type="submit" disabled={cargando} className={`px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm ${cargando ? 'opacity-50 cursor-wait' : ''}`}>{cargando ? 'Guardando...' : 'Guardar Cambios'}</button></div></form></div></div>);
};
