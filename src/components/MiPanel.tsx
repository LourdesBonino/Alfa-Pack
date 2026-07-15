import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Edit, Trash2 } from 'lucide-react';
import type { Pedido, Cliente, EstadoPedido } from '../types/database';
import { ModalEditarPedido } from './ModalEditarPedido';
import { ModalRendicionTurno } from './ModalRendicionTurno';
import { ComprobanteOperacion } from './ComprobanteOperacion';

interface Props {
    onNavigate: (tab: string) =>void;
}

type PedidoConCliente = Pedido & { clientes: Cliente };

export const MiPanel = ({ onNavigate }: Props) =>{
    const [rutasManana, setRutasManana] = useState<PedidoConCliente[]>([]);
    const [rutasTarde, setRutasTarde] = useState<PedidoConCliente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);
    const [pedidoEditando, setPedidoEditando] = useState<PedidoConCliente | null>(null);
    const [comprobanteActivo, setComprobanteActivo] = useState<PedidoConCliente | null>(null);
    const [mostrandoRendicion, setMostrandoRendicion] = useState(false);
    const [enProcesoCierre, setEnProcesoCierre] = useState(false);
    const [imprimiendoTurno, setImprimiendoTurno] = useState<'manana' | 'tarde' | null>(null);

    const pendientesRendicion = rutasManana.filter(p =>p.condicion === 'entregar' && p.estado === 'entregado');

    useEffect(() =>{
        if (enProcesoCierre && mostrandoRendicion && pendientesRendicion.length === 0 && !cargando) {
            setMostrandoRendicion(false);
            setEnProcesoCierre(false);
            ejecutarCierreTurnoManana();
        }
    }, [pendientesRendicion.length, enProcesoCierre, mostrandoRendicion, cargando]);

    const fetchRecorridos = async () =>{
        setCargando(true);
        const { data, error } = await supabase
            .from('pedidos')
            .select('*, clientes!cliente_id(*)')
            .not('estado', 'in', '("finalizado_efectivo","finalizado_cuenta_corriente","finalizado_rendido","cancelado","pospuesto")')
            .eq('fecha_ejecucion', fechaFiltro)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error al obtener pedidos:", error);
            alert("Error al cargar pedidos: " + error.message);
        }

        const activos = (data as PedidoConCliente[]) || [];

        const manana = activos.filter(p =>['programado', 'pendiente_retiro', 'en_proceso_de_reembolso', 'en_viaje_reembolso'].includes(p.estado) ||
            (p.estado === 'en_viaje' && p.condicion === 'entregar') ||
            (p.estado === 'entregado' && p.condicion === 'entregar')
        );

        const tarde = activos.filter(p =>['retirado'].includes(p.estado) ||
            (p.estado === 'entregado' && p.condicion !== 'entregar') ||
            (p.estado === 'en_viaje' && (p.condicion === 'retirar' || p.condicion === 'contra_rembolso'))
        );

        setRutasManana(manana);
        setRutasTarde(tarde);
        setCargando(false);
    };

    useEffect(() =>{
        fetchRecorridos();
    }, [fechaFiltro]);

    const actualizarEstado = async (id: string, nuevoEstado: EstadoPedido) =>{
        await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id);
        fetchRecorridos();
    };

    const iniciarProcesoReembolso = async (pedido: PedidoConCliente) =>{
        const partes = pedido.fecha_ejecucion.split('-');
        const fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        fecha.setDate(fecha.getDate() + 1);
        
        if (fecha.getDay() === 6) fecha.setDate(fecha.getDate() + 2); // Saturday ->Monday
        else if (fecha.getDay() === 0) fecha.setDate(fecha.getDate() + 1); // Sunday ->Monday
        
        const nuevaFechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
        
        await supabase.from('pedidos').update({ 
            estado: 'en_proceso_de_reembolso',
            fecha_ejecucion: nuevaFechaStr
        }).eq('id', pedido.id);
        
        fetchRecorridos();
    };

    const finalizarCobro = async (pedido: PedidoConCliente, tipoCobro: 'efectivo' | 'cuenta_corriente' | 'ya_abonado') =>{
        const updates: any = {};
        
        if (tipoCobro === 'efectivo') {
            updates.estado = 'finalizado_efectivo';
            updates.abonado = true;
            updates.monto_abonado = pedido.precio_envio;
            updates.forma_cobro = pedido.forma_cobro === 'origen' ? 'origen' : 'destino';
        } else if (tipoCobro === 'cuenta_corriente') {
            updates.estado = 'finalizado_cuenta_corriente';
            // Si la forma de cobro era destino y se pasa a cta cte, lo marcamos para que lo absorba el destinatario
            updates.forma_cobro = pedido.forma_cobro === 'destino' ? 'cuenta_corriente_destino' : 'cuenta_corriente';
        } else if (tipoCobro === 'ya_abonado') {
            updates.estado = pedido.forma_cobro === 'cuenta_corriente' ? 'finalizado_cuenta_corriente' : 'finalizado_efectivo';
        }

        await supabase.from('pedidos').update(updates).eq('id', pedido.id);
        fetchRecorridos();
    };

    const borrarPedido = async (id: string) =>{
        if (!confirm('¿Estás seguro de que deseas eliminar este pedido por completo? Esta acción no se puede deshacer.')) return;
        setCargando(true);
        const { error } = await supabase.from('pedidos').delete().eq('id', id);
        if (error) alert("Error al eliminar: " + error.message);
        fetchRecorridos();
    };

    const iniciarCierreTurnoManana = () =>{
        if (!confirm('¿Estás seguro de cerrar el turno mañana?\nEsto moverá automáticamente los retiros listos a la planilla de la tarde y finalizará las entregas/reembolsos.')) return;
        
        if (pendientesRendicion.length >0) {
            setEnProcesoCierre(true);
            setMostrandoRendicion(true);
        } else {
            ejecutarCierreTurnoManana();
        }
    };

    const ejecutarCierreTurnoManana = async () =>{
        setCargando(true);
        
        // Pasar los retiros listos a viaje en la tarde (solo los que vemos hoy)
        const promesasViaje = [...rutasManana, ...rutasTarde]
            .filter(p =>p.estado === 'retirado')
            .map(p =>supabase.from('pedidos').update({ estado: 'en_viaje' }).eq('id', p.id));
        
        // Finalizar reembolsos que estén en proceso
        const promesasReembolso = rutasManana
            .filter(p =>p.condicion === 'contra_rembolso' && (p.estado === 'en_proceso_de_reembolso' || p.estado === 'en_viaje_reembolso'))
            .map(p =>supabase.from('pedidos').update({ estado: 'finalizado_rendido' }).eq('id', p.id));
            
        await Promise.all([...promesasViaje, ...promesasReembolso]);
        
        fetchRecorridos();
    };

    const imprimirHoja = (turno: 'manana' | 'tarde') =>{
        setImprimiendoTurno(turno);
        setTimeout(() => {
            window.print();
            setTimeout(() => setImprimiendoTurno(null), 500);
        }, 100);
    };

    return (<>{comprobanteActivo && (<ComprobanteOperacion 
                    pedido={comprobanteActivo}
                    onClose={() =>setComprobanteActivo(null)}
                />)}<div className={`w-full max-w-[1400px] mx-auto animate-fade-in-up flex flex-col print:m-0 print:max-w-none ${comprobanteActivo ? 'print:hidden' : ''}`}><div className="flex justify-between items-end mb-8 print:hidden"><div><h2 className="text-3xl font-black text-slate-800 tracking-tight">Panel Operativo</h2><p className="text-sm text-slate-500 mt-1">Gestión de itinerarios diarios según flujo de trabajo.</p></div><div className="flex gap-3 items-center"><input 
                        type="date"
                        className="brand-input px-4 py-2.5 rounded font-semibold text-sm border-slate-200"
                        value={fechaFiltro}
                        onChange={(e) =>setFechaFiltro(e.target.value)}
                    /><button onClick={() =>onNavigate('recorrido')} className="brand-accent-bg px-6 py-2.5 rounded font-bold text-sm tracking-wide shadow-md active:scale-95 transition-all text-white">+ NUEVO ENVÍO</button></div></div>{cargando ? (<div className="text-center py-20 text-slate-400 font-bold flex flex-col items-center gap-4"><svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span>Cargando itinerarios...</span></div>) : (<div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">{/* ======================= COLUMNA MAÑANA ======================= */}<div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm print:hidden flex flex-col gap-4"><div className="flex items-center gap-3"><span className="text-2xl"></span><h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Turno Mañana</h3><span className="ml-auto bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{rutasManana.length}</span></div><p className="text-xs text-slate-500 -mt-2 mb-2">Entregas de paquetes del día anterior, Retiros nuevos y Reembolsos.</p><div className="flex flex-col gap-3">{rutasManana.length === 0 ? (<p className="text-sm text-slate-400 italic text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">No hay tareas matutinas pendientes.</p>) : (
                                rutasManana.map(pedido =>(<div key={pedido.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden flex flex-col gap-3"><div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                            pedido.condicion === 'entregar' ? 'bg-teal-500' :
                                            pedido.condicion === 'contra_rembolso' ? 'bg-amber-500' : 'bg-blue-500'
                                        }`}></div><div className="flex justify-between items-start pl-2"><div><div className="flex gap-2 items-center mb-1"><span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                                        pedido.condicion === 'entregar' ? 'bg-teal-100 text-teal-800' :
                                                        pedido.condicion === 'contra_rembolso' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>{pedido.condicion.replace('_', ' ')}</span><span className="text-[9px] font-bold text-slate-400 uppercase">ESTADO: {pedido.estado.replace(/_/g, ' ')}</span><div className="ml-auto flex items-center gap-1"><button onClick={() =>setComprobanteActivo(pedido)} className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-500 rounded transition-colors" title="Generar Comprobante"><FileText size={14} strokeWidth={2.5} /></button><button onClick={() =>setPedidoEditando(pedido)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors" title="Editar Pedido"><Edit size={14} strokeWidth={2.5} /></button><button onClick={() =>borrarPedido(pedido.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded transition-colors" title="Eliminar Pedido"><Trash2 size={14} strokeWidth={2.5} /></button><span className="text-[10px] font-black text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded ml-1">#{String(pedido.id).split('-')[0].toUpperCase()}</span></div></div><h4 className="font-bold text-slate-800">{
                                                        pedido.condicion === 'entregar' || pedido.estado === 'en_viaje_reembolso' || pedido.estado === 'en_proceso_de_reembolso'
                                                            ? pedido.destinatario_nombre
                                                            : pedido.clientes?.nombre_razon_social
                                                    }</h4><p className="text-xs text-slate-500 mt-0.5">{
                                                        pedido.condicion === 'entregar' || pedido.estado === 'en_viaje_reembolso' || pedido.estado === 'en_proceso_de_reembolso' ? (
                                                            pedido.entrega_en_oficina ? (<span className="font-bold">Se retira por sucursal</span>) : (pedido.direccion_entrega || 'Sin dirección')
                                                        ) : (
                                                            pedido.retiro_en_sucursal ? (<span className="font-bold">Sucursal Río Cuarto</span>) : (pedido.direccion_retiro || `${pedido.clientes?.direccion}, ${pedido.clientes?.localidad}`)
                                                        )
                                                    }</p><p className="text-xs font-semibold text-slate-600 mt-2">{
                                                        pedido.condicion === 'entregar' || pedido.estado === 'en_viaje_reembolso' || pedido.estado === 'en_proceso_de_reembolso'
                                                            ? `Remitente: ${pedido.clientes?.nombre_razon_social}`
                                                            : `Para: ${pedido.destinatario_nombre}`
                                                    }</p></div></div>{/* ACCIONES DE MAÑANA */}<div className="pl-2 border-t border-slate-100 pt-3 mt-1 flex gap-2 flex-wrap">{/* CAMINO A: Entregar */}
                                            {pedido.condicion === 'entregar' && pedido.estado === 'programado' && (<button onClick={() =>actualizarEstado(pedido.id, 'en_viaje')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded transition-colors border border-slate-200">Emitir Planilla (Ir)</button>)}
                                            {pedido.condicion === 'entregar' && pedido.estado === 'en_viaje' && (<button onClick={() =>{
                                                    if (pedido.forma_cobro === 'origen' || pedido.forma_cobro === 'cuenta_corriente') {
                                                        finalizarCobro(pedido, 'ya_abonado');
                                                    } else {
                                                        actualizarEstado(pedido.id, 'entregado');
                                                    }
                                                }} className="bg-teal-100 hover:bg-teal-200 text-teal-800 text-xs font-bold py-2 px-3 rounded transition-colors border border-teal-200">Finalizar Viaje (Entregado)</button>)}
                                            
                                            {/* COBROS MAÑANA */}
                                            {pedido.condicion === 'entregar' && pedido.estado === 'entregado' && (<div className="flex gap-2 w-full mt-2 border-t border-slate-200 pt-2">{(pedido.forma_cobro === 'origen' || pedido.forma_cobro === 'cuenta_corriente') ? (<button onClick={() =>finalizarCobro(pedido, 'ya_abonado')} className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold py-2 px-3 rounded transition-colors border border-emerald-200">Cerrar ({pedido.forma_cobro === 'origen' ? 'Ya Abonado' : 'Cta. Cte.'})</button>) : (<><button onClick={() =>finalizarCobro(pedido, 'efectivo')} className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold py-2 px-3 rounded transition-colors border border-emerald-200">Cobro Efectivo</button><button onClick={() =>finalizarCobro(pedido, 'cuenta_corriente')} className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold py-2 px-3 rounded transition-colors border border-purple-200">Pasa a Cta Cte</button></>)}</div>)}

                                            {/* CAMINO B/C: Retirar */}
                                            {(pedido.condicion === 'retirar' || pedido.condicion === 'contra_rembolso') && pedido.estado === 'programado' && (<button onClick={() =>actualizarEstado(pedido.id, 'pendiente_retiro')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded transition-colors border border-slate-200">Emitir Planilla de Viaje</button>)}
                                            {(pedido.condicion === 'retirar' || pedido.condicion === 'contra_rembolso') && pedido.estado === 'pendiente_retiro' && (<button onClick={() =>actualizarEstado(pedido.id, 'retirado')} className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold py-2 px-3 rounded transition-colors border border-blue-200 flex items-center gap-1">Finalizar Retiro<span className="text-[10px] opacity-70">Pasa a Tarde</span></button>)}

                                            {/* CAMINO C (DIA 2): Reembolso */}
                                            {pedido.condicion === 'contra_rembolso' && pedido.estado === 'en_proceso_de_reembolso' && (<button onClick={() =>actualizarEstado(pedido.id, 'en_viaje_reembolso')} className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold py-2 px-3 rounded transition-colors border border-amber-200">Emitir Planilla (Llevar Dinero)</button>)}
                                            {pedido.condicion === 'contra_rembolso' && pedido.estado === 'en_viaje_reembolso' && (<button onClick={() =>actualizarEstado(pedido.id, 'finalizado_rendido')} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold py-2 px-3 rounded transition-colors border border-emerald-200">Finalizar (Dinero Rendido)</button>)}</div></div>))
                            )}</div><div className="mt-4"><button onClick={() =>imprimirHoja('manana')} className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors shadow-sm">️ Imprimir Planilla Turno Mañana</button></div></div>{/* ======================= COLUMNA TARDE ======================= */}<div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm print:hidden flex flex-col gap-4"><div className="flex items-center gap-3"><span className="text-2xl"></span><h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Turno Tarde</h3><span className="ml-auto bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">{rutasTarde.length}</span></div><p className="text-xs text-slate-500 -mt-2 mb-2">Reparto de paquetes retirados en la mañana (Camino B y C).</p><div className="flex flex-col gap-3">{rutasTarde.length === 0 ? (<p className="text-sm text-slate-400 italic text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">No hay repartos vespertinos pendientes.</p>) : (
                                rutasTarde.map(pedido =>(<div key={pedido.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden flex flex-col gap-3"><div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div><div className="flex justify-between items-start pl-2"><div className="w-full"><div className="flex gap-2 items-center mb-1"><span className="text-[9px] font-black bg-slate-100 text-slate-600 uppercase tracking-wider px-2 py-0.5 rounded">{pedido.condicion.replace('_', ' ')}</span><span className="text-[9px] font-bold text-slate-400 uppercase">ESTADO: {pedido.estado.replace(/_/g, ' ')}</span><div className="ml-auto flex items-center gap-1"><button onClick={() =>setComprobanteActivo(pedido)} className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-500 rounded transition-colors" title="Generar Comprobante"><FileText size={14} strokeWidth={2.5} /></button><button onClick={() =>setPedidoEditando(pedido)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors" title="Editar Pedido"><Edit size={14} strokeWidth={2.5} /></button><button onClick={() =>borrarPedido(pedido.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded transition-colors" title="Eliminar Pedido"><Trash2 size={14} strokeWidth={2.5} /></button><span className="text-[10px] font-black text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded ml-1">#{String(pedido.id).split('-')[0].toUpperCase()}</span></div></div><p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mt-2 mb-0.5">Entregar a</p><h4 className="font-bold text-slate-800">{pedido.clientes?.nombre_razon_social}</h4><p className="text-xs text-slate-500 mt-0.5">{pedido.entrega_en_oficina ? (<span className="font-bold text-slate-700">Se retira por sucursal</span>) : (
                                                        pedido.direccion_entrega || `${pedido.clientes?.direccion}, ${pedido.clientes?.localidad}`
                                                    )}</p><p className="text-[10px] text-slate-400 mt-0.5">Remitente: {pedido.destinatario_nombre}</p>{pedido.condicion === 'contra_rembolso' ? (<div className="mt-3 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center justify-between"><span className="text-[10px] font-bold text-amber-800">COBRAR AL DESTINATARIO:</span><span className="text-sm font-black text-amber-600">${pedido.precio_envio + pedido.valor_mercaderia}</span></div>) : pedido.forma_cobro === 'destino' ? (<div className="mt-3 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center justify-between"><span className="text-[10px] font-bold text-amber-800">COBRAR ENVÍO AL DESTINATARIO:</span><span className="text-sm font-black text-amber-600">${pedido.precio_envio}</span></div>) : null}</div></div>{/* ACCIONES DE TARDE */}<div className="pl-2 border-t border-slate-100 pt-3 mt-1 flex gap-2 flex-wrap">{pedido.estado === 'retirado' && (<button onClick={() =>actualizarEstado(pedido.id, 'en_viaje')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded transition-colors border border-slate-200 w-full">Emitir Planilla de Entrega</button>)}
                                            {pedido.estado === 'en_viaje' && (<button onClick={() =>{
                                                    if (pedido.condicion !== 'contra_rembolso' && (pedido.forma_cobro === 'origen' || pedido.forma_cobro === 'cuenta_corriente')) {
                                                        finalizarCobro(pedido, 'ya_abonado');
                                                    } else {
                                                        actualizarEstado(pedido.id, 'entregado');
                                                    }
                                                }} className="bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold py-2 px-3 rounded transition-colors border border-orange-200 w-full">Finalizar Recorrido (Entregado)</button>)}
                                            {pedido.estado === 'entregado' && (<div className="flex gap-2 w-full">{pedido.condicion === 'contra_rembolso' ? (<button onClick={() =>iniciarProcesoReembolso(pedido)} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold py-2 px-3 rounded transition-colors border border-amber-200 flex items-center justify-center gap-1">Proceso de Reembolso<span className="text-[10px] opacity-70">Pasa a Mañana</span></button>) : (pedido.forma_cobro === 'origen' || pedido.forma_cobro === 'cuenta_corriente') ? (<button onClick={() =>finalizarCobro(pedido, 'ya_abonado')} className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold py-2 px-3 rounded transition-colors border border-emerald-200">Finalizar Viaje ({pedido.forma_cobro === 'origen' ? 'Abonado en Origen' : 'Cta. Corriente ya asignada'})</button>) : (<><button onClick={() =>finalizarCobro(pedido, 'efectivo')} className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold py-2 px-3 rounded transition-colors border border-emerald-200">Cobro Efectivo</button><button onClick={() =>finalizarCobro(pedido, 'cuenta_corriente')} className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold py-2 px-3 rounded transition-colors border border-purple-200">Pasa a Cta Cte</button></>)}</div>)}</div></div>))
                            )}</div><button onClick={() =>imprimirHoja('tarde')} className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors shadow-sm">️ Imprimir Planilla Turno Tarde</button></div></div>)}

            {/* ======================= IMPRESIÓN ======================= */}<div className="hidden print:block w-full">
                <div className="mb-6 border-b-4 border-black pb-4 text-center mt-2">
                    <h1 className="text-3xl font-black italic tracking-tighter">ALFA<span className="text-gray-500">PACK</span>- ITINERARIO DIARIO</h1>
                    <p className="text-sm font-semibold uppercase mt-1">Dirección: Bv. Alte. Brown 362 - General Deheza | Tel: 358-4387150 / 358-4226587</p>
                    <p className="text-lg font-bold mt-2">Planilla de Entregas y Retiros | Fecha: {fechaFiltro.split('-').reverse().join('/')}</p>
                </div>
                {(!imprimiendoTurno || imprimiendoTurno === 'manana') && rutasManana.length >0 && (<div className="mb-10 page-break-inside-avoid"><h2 className="text-xl font-bold bg-black text-white p-2 mb-4">TURNO MAÑANA - Retiros, Entregas y Reembolsos</h2><table className="w-full border-collapse border border-black text-sm"><thead><tr className="bg-gray-200"><th className="border border-black p-2 text-left">Acción</th><th className="border border-black p-2 text-left">Cliente</th><th className="border border-black p-2 text-left">Dirección</th><th className="border border-black p-2 text-left">Referencia</th><th className="border border-black p-2 text-center">Firma</th></tr></thead><tbody>{rutasManana.map(pedido =>(<tr key={pedido.id}><td className="border border-black p-2 font-bold uppercase text-[10px]">{pedido.estado === 'en_viaje_reembolso' || pedido.estado === 'en_proceso_de_reembolso' ? 'LLEVAR DINERO DE CONTRA REEMBOLSO' : 
                                             pedido.condicion === 'entregar' ? `ENTREGAR ${pedido.cantidad_bultos || 1} BULTO(S)` : `RETIRAR ${pedido.cantidad_bultos || 1} BULTO(S)`}</td><td className="border border-black p-2 font-bold">#{String(pedido.id).split('-')[0].toUpperCase()} - {pedido.clientes?.nombre_razon_social}</td><td className="border border-black p-2 text-xs">{
                                                pedido.condicion === 'entregar' || pedido.estado === 'en_viaje_reembolso' || pedido.estado === 'en_proceso_de_reembolso' ? (
                                                    pedido.entrega_en_oficina ? (<span className="font-black">SE RETIRA POR SUCURSAL</span>) : (
                                                        pedido.direccion_entrega || 'Sin dirección'
                                                    )
                                                ) : (
                                                    pedido.retiro_en_sucursal ? (<span className="font-black">SUCURSAL RÍO CUARTO</span>) : (
                                                        pedido.direccion_retiro || `${pedido.clientes?.direccion}, ${pedido.clientes?.localidad}`
                                                    )
                                                )
                                            }</td><td className="border border-black p-2">{pedido.destinatario_nombre}
                                            {pedido.condicion === 'contra_rembolso' ? (<div className="font-black text-xs uppercase mt-1">** CONTRA REEMBOLSO **</div>) : pedido.forma_cobro === 'destino' ? (<div className="font-black text-xs uppercase mt-1">** SE PAGA EN DESTINO **</div>) : null}</td><td className="border border-black p-2 w-32 h-16"></td></tr>))}</tbody></table></div>)}

                {(!imprimiendoTurno || imprimiendoTurno === 'tarde') && rutasTarde.length >0 && (<div className="page-break-inside-avoid"><h2 className="text-xl font-bold bg-black text-white p-2 mb-4">TURNO TARDE - Reparto</h2><table className="w-full border-collapse border border-black text-sm"><thead><tr className="bg-gray-200"><th className="border border-black p-2 text-left">Destinatario</th><th className="border border-black p-2 text-left">Remitente</th><th className="border border-black p-2 text-center">A Cobrar</th><th className="border border-black p-2 text-center">Firma Recepción</th></tr></thead><tbody>{rutasTarde.map(pedido =>(<tr key={pedido.id}><td className="border border-black p-2 font-bold">#{String(pedido.id).split('-')[0].toUpperCase()} - {pedido.clientes?.nombre_razon_social}<div className="text-sm font-bold mt-1 uppercase">{pedido.entrega_en_oficina ? (<span>SE RETIRA POR SUCURSAL</span>) : (
                                                    pedido.direccion_entrega || `${pedido.clientes?.direccion}, ${pedido.clientes?.localidad}`
                                                )}</div><div className="text-[10px] text-gray-500 font-normal uppercase mt-0.5">{pedido.cantidad_bultos || 1} bulto(s)</div>{pedido.condicion === 'contra_rembolso' ? (<div className="font-black text-xs uppercase mt-1">** CONTRA REEMBOLSO **</div>) : pedido.forma_cobro === 'destino' ? (<div className="font-black text-xs uppercase mt-1">** SE PAGA EN DESTINO **</div>) : null}</td><td className="border border-black p-2">{pedido.destinatario_nombre}</td><td className="border border-black p-2 text-center font-bold">{pedido.condicion === 'contra_rembolso' ? `$${pedido.precio_envio + pedido.valor_mercaderia}` : pedido.forma_cobro === 'destino' ? `$${pedido.precio_envio}` : '-'}</td><td className="border border-black p-2 w-40 h-16"></td></tr>))}</tbody></table></div>)}</div>{pedidoEditando && (<ModalEditarPedido 
                    pedido={pedidoEditando}
                    onClose={() =>setPedidoEditando(null)}
                    onGuardado={fetchRecorridos}
                />)}
            {mostrandoRendicion && (<ModalRendicionTurno 
                    pedidos={pendientesRendicion}
                    onResolver={finalizarCobro}
                    onClose={() =>{
                        setMostrandoRendicion(false);
                        setEnProcesoCierre(false);
                    }}
                    cargando={cargando}
                />)}</div></>);
};
