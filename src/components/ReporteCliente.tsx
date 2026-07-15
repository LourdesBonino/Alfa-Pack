import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SelectorCliente } from './SelectorCliente';
import { ComprobanteOperacion } from './ComprobanteOperacion';
import type { Pedido, Cliente } from '../types/database';

type PedidoConCliente = Pedido & { clientes: Cliente, destinatario?: Cliente | null };

interface Props {
    initialClienteId?: string;
    initialClienteNombre?: string;
    initialTab?: 'resumen' | 'cobranza';
}

export const ReporteCliente = ({ initialClienteId, initialClienteNombre, initialTab }: Props = {}) =>{
    const [clienteId, setClienteId] = useState<string | null>(initialClienteId || null);
    const [clienteNombre, setClienteNombre] = useState<string | null>(initialClienteNombre || null);
    const [clienteDniCuit, setClienteDniCuit] = useState<string | null>(null);
    const [mesAnio, setMesAnio] = useState<string>(
        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    );
    const [pedidos, setPedidos] = useState<PedidoConCliente[]>([]);
    const [cargando, setCargando] = useState(false);
    const [activeTab, setActiveTab] = useState<'resumen' | 'cobranza'>(initialTab || 'resumen');
    
    // Estados para comprobante
    const [comprobanteActivo, setComprobanteActivo] = useState<PedidoConCliente | null>(null);

    // Estados para el pago parcial
    const [montoPago, setMontoPago] = useState<string>('');
    const [procesandoPago, setProcesandoPago] = useState(false);

    useEffect(() => {
        if (clienteId) {
            supabase.from('clientes').select('dni_cuit').eq('id', clienteId).single().then(({data}) => {
                setClienteDniCuit(data?.dni_cuit || null);
            });
        } else {
            setClienteDniCuit(null);
        }
    }, [clienteId]);

    const fetchReporte = async () =>{
        if (!clienteId || !mesAnio) {
            setPedidos([]);
            return;
        }

        setCargando(true);
        const startDate = `${mesAnio}-01`;
        const endYear = parseInt(mesAnio.split('-')[0]);
        const endMonth = parseInt(mesAnio.split('-')[1]);
        const nextMonthDate = new Date(endYear, endMonth, 1);
        const endDate = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;

        const { data, error } = await supabase
            .from('pedidos')
            .select('*, clientes!pedidos_cliente_id_fkey(*), destinatario:clientes!pedidos_destinatario_id_fkey(*)')
            .or(`cliente_id.eq.${clienteId},destinatario_id.eq.${clienteId}`)
            .gte('fecha_registro', startDate)
            .lt('fecha_registro', endDate)
            .order('fecha_registro', { ascending: true });

        if (!error && data) {
            setPedidos(data as PedidoConCliente[]);
        } else {
            setPedidos([]);
        }
        setCargando(false);
    };

    useEffect(() =>{
        fetchReporte();
        setActiveTab('resumen');
    }, [clienteId, mesAnio]);

    // Lógica de Pagos en Cascada
    const registrarPago = async (e: React.FormEvent) =>{
        e.preventDefault();
        let monto = parseFloat(montoPago);
        if (isNaN(monto) || monto<= 0) return;

        setProcesandoPago(true);

        const pendientes = [...pedidosEnDeuda].sort((a, b) =>new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime());
        
        let remanente = monto;

        for (const pedido of pendientes) {
            if (remanente<= 0) break;

            const costoTotal = pedido.precio_envio;
            const yaAbonado = pedido.monto_abonado || 0;
            const deudaRestante = costoTotal - yaAbonado;

            if (deudaRestante<= 0) continue;

            const aPagarEnEsteViaje = Math.min(remanente, deudaRestante);
            const nuevoAbonado = yaAbonado + aPagarEnEsteViaje;
            const esAbonadoTotal = nuevoAbonado >= costoTotal;

            const updateData: Partial<Pedido>= { monto_abonado: nuevoAbonado };
            if (esAbonadoTotal) {
                updateData.abonado = true;
                updateData.estado = 'finalizado_cuenta_corriente';
            }

            const { error } = await supabase.from('pedidos').update(updateData).eq('id', pedido.id);
            
            if (!error) {
                setPedidos(prev =>prev.map(p =>p.id === pedido.id ? { ...p, ...updateData } : p));
            } else {
                alert(`Error al actualizar el viaje ${pedido.id}: ` + error.message);
                break;
            }
            
            remanente -= aPagarEnEsteViaje;
        }

        setMontoPago('');
        setProcesandoPago(false);
        if (remanente >0) {
            alert(` Pago procesado exitosamente.\n\nNota: Hubo un excedente a favor de $${remanente.toFixed(2)} que superó la deuda del mes visible.`);
        }
    };

    const abonarTotalidad = () =>{
        setMontoPago(totalDeuda.toFixed(2));
    };

    const totalEnvios = pedidos.reduce((sum, p) =>sum + (p.precio_envio || 0), 0);
    

    const pedidosEnDeuda = pedidos.filter(p =>{
        if (p.abonado) return false;
        if (p.cliente_id === clienteId && p.forma_cobro === 'cuenta_corriente') return true;
        if (p.destinatario_id === clienteId && p.forma_cobro === 'cuenta_corriente_destino') return true;
        return false;
    });
    
    const totalDeuda = pedidosEnDeuda.reduce((sum, p) =>sum + (p.precio_envio - (p.monto_abonado || 0)), 0);

    return (<>{comprobanteActivo && (<ComprobanteOperacion 
                pedido={comprobanteActivo} 
                onClose={() =>setComprobanteActivo(null)} 
            />)}<div className={`w-full relative animate-fade-in print:bg-white print:m-0 print:p-0 ${comprobanteActivo ? 'print:hidden' : ''}`}><div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md mb-6 print:border-none print:shadow-none print:p-0 print:mb-4">{/* VISIBLE SÓLO EN IMPRESIÓN */}
                    {clienteId && (
                        <div className="hidden print:block mb-6 text-left">
                            <div className="mb-8">
                                <h1 className="text-5xl font-black italic tracking-tighter leading-none mb-2">ALFA<span className="text-gray-700">PACK</span></h1>
                                <p className="text-lg font-bold uppercase tracking-widest text-gray-800 mb-1">Servicio de Logística</p>
                                <p className="text-xs font-bold uppercase text-gray-800 leading-tight">Dirección: Bv. Alte. Brown 362 - General Deheza<br/>Tel: 358-4387150 / 358-4226587</p>
                            </div>
                            <div className="border-b-4 border-black pb-2 flex justify-between items-end mb-4">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Reporte Mensual y Estado de Cuenta</h2>
                                    {clienteNombre && <h3 className="text-lg font-bold mt-1 text-gray-700">Cliente: {clienteNombre} {clienteDniCuit && <span className="font-semibold text-gray-500 text-sm ml-2">CUIT/DNI: {clienteDniCuit}</span>}</h3>}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold bg-gray-100 px-3 py-1 rounded">Período: {mesAnio}</p>
                                </div>
                            </div>
                        </div>
                    )}<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden"><div><span className="text-[10px] font-bold brand-primary-text uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">Reportes</span><h2 className="text-xl md:text-2xl font-black text-slate-800 mt-2 tracking-tight">Reporte Mensual y Cuenta Corriente</h2></div></div><div className="flex flex-col sm:flex-row gap-6 mb-4 print:hidden"><div className="flex-1 max-w-xl"><SelectorCliente 
                                onSelect={(id, cliente) =>{
                                    setClienteId(id);
                                    setClienteNombre(cliente ? cliente.nombre_razon_social : null);
                                }} 
                                initialClienteId={initialClienteId}
                                initialClienteNombre={initialClienteNombre}
                            /></div><div className="w-full sm:w-48 flex flex-col gap-2"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Período (Mes/Año)</label><input 
                                type="month" 
                                className="brand-input px-4 py-2.5 bg-white border-2 border-slate-200 rounded text-sm font-semibold w-full"
                                value={mesAnio}
                                onChange={(e) =>setMesAnio(e.target.value)}
                            /></div></div>{clienteId && !cargando && (<div className="flex gap-4 mt-6 border-b border-slate-200 print:hidden"><button
                            onClick={() =>setActiveTab('resumen')}
                            className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'resumen' ? 'text-[#0046b0]' : 'text-slate-500'}`}
                        >Resumen Mensual</button><button
                            onClick={() =>setActiveTab('cobranza')}
                            className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'cobranza' ? 'text-[#0046b0]' : 'text-slate-500'}`}
                        >Cobranza Cuenta Corriente</button></div>)}</div>{cargando ? (<div className="py-12 flex justify-center">Cargando...</div>) : !clienteId ? (<div className="py-12 text-center">Selecciona un cliente.</div>) : pedidos.length === 0 ? (<div className="py-12 text-center">No hay datos.</div>) : (<>{activeTab === 'resumen' && (<div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md animate-fade-in"><div className="flex justify-between items-center mb-6 print:hidden"><div><h3 className="text-lg font-black text-slate-800">Historial de Envíos</h3><p className="text-xs text-slate-500">Detalle de todos los movimientos del mes</p></div><button onClick={() =>window.print()} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2">️ Imprimir Reporte</button></div><div className="overflow-x-auto border border-slate-200 rounded-xl"><table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-slate-50 border-b border-slate-200 text-slate-600"><tr><th className="py-3 px-4 font-bold">Fecha</th><th className="py-3 px-4 font-bold">Destinatario</th><th className="py-3 px-4 font-bold">Condición</th><th className="py-3 px-4 font-bold text-right">Costo</th><th className="py-3 px-4 font-bold text-center print:hidden">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{pedidos.map(pedido =>(<tr key={pedido.id} className="hover:bg-slate-50 transition-colors"><td className="py-3 px-4 font-semibold text-slate-800">{new Date(pedido.fecha_registro).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</td><td className="py-3 px-4 text-slate-700">{pedido.destinatario_nombre}</td><td className="py-3 px-4 text-slate-500">{pedido.condicion === 'entregar' ? 'Entrega' : 
                                                     pedido.condicion === 'retirar' ? 'Retiro' : 'Contra Reembolso'}</td><td className="py-3 px-4 text-right text-emerald-600 font-bold">${pedido.precio_envio.toFixed(2)}</td><td className="py-3 px-4 text-center print:hidden"><button onClick={() =>setComprobanteActivo(pedido)} className="text-indigo-500 hover:text-indigo-700 transition-colors text-lg" title="Imprimir Guía de Transporte"></button></td></tr>))}</tbody></table></div><div className="mt-6 flex flex-col items-end gap-3 print:block print:mt-8"><div className="bg-slate-50 print:bg-white print:border-b print:border-slate-300 print:rounded-none p-4 print:p-2 print:py-3 rounded-xl border border-slate-200 w-full max-w-sm print:max-w-none flex justify-between items-center"><span className="text-slate-500 print:text-slate-600 font-bold uppercase tracking-widest text-xs">Total Facturado en el Mes</span><span className="text-xl font-black text-slate-800 print:text-black">${totalEnvios.toFixed(2)}</span></div><div className="bg-rose-50 print:bg-white print:border-b-2 print:border-black print:rounded-none p-4 print:p-2 print:py-3 rounded-xl border border-rose-200 w-full max-w-sm print:max-w-none flex justify-between items-center"><span className="text-rose-700 print:text-black font-black uppercase tracking-widest text-xs">Saldo Deudor en Cta. Cte.</span><span className="text-2xl font-black text-rose-900 print:text-black">${totalDeuda.toFixed(2)}</span></div><div className="hidden print:block mt-2 text-right"><p className="text-[10px] text-gray-500 font-semibold uppercase">Documento generado por Alfa Pack el {new Date().toLocaleDateString()}</p></div></div></div>)}

                    {activeTab === 'cobranza' && (<div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md animate-fade-in"><div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"><div><h3 className="text-lg font-black text-slate-800">Caja y Cobranzas</h3><p className="text-xs text-slate-500">Registra un pago parcial o total. El sistema saldará los viajes más antiguos automáticamente.</p></div><div className="text-right bg-rose-50 px-4 py-2 rounded-xl border border-rose-200"><span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest block mb-0.5">Deuda Total de este mes</span><span className="text-2xl font-black text-rose-900">${totalDeuda.toFixed(2)}</span></div></div>{pedidosEnDeuda.length === 0 ? (<div className="py-12 text-center text-emerald-600 font-bold border-2 border-dashed border-emerald-200 bg-emerald-50 rounded-2xl">¡Excelente! El cliente no tiene envíos en deuda este mes.</div>) : (<>{/* PANEL DE PAGO */}<div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6"><form onSubmit={registrarPago} className="flex flex-col md:flex-row items-end gap-4"><div className="flex-1 w-full"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider block mb-2">Ingresar Monto a Abonar ($)</label><div className="relative"><span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-600 font-bold text-lg">$</span><input 
                                                        type="number"
                                                        step="0.01"
                                                        min="1"
                                                        max={totalDeuda}
                                                        value={montoPago}
                                                        onChange={(e) =>setMontoPago(e.target.value)}
                                                        placeholder="0.00"
                                                        className="brand-input pl-9 pr-4 py-3 rounded-lg w-full text-lg font-black text-emerald-800 border-emerald-300 focus:border-emerald-500 bg-white"
                                                    /></div></div><div className="flex gap-2 w-full md:w-auto"><button 
                                                    type="button"
                                                    onClick={abonarTotalidad}
                                                    className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors text-sm whitespace-nowrap"
                                                >Abonar Total</button><button 
                                                    type="submit"
                                                    disabled={procesandoPago || !montoPago || parseFloat(montoPago)<= 0}
                                                    className={`px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                                        procesandoPago ? 'opacity-70 cursor-wait' : ''
                                                    }`}
                                                >{procesandoPago ? 'PROCESANDO...' : 'REGISTRAR PAGO'}</button></div></form></div>{/* TABLA DE DEUDAS */}<div className="overflow-x-auto border border-slate-200 rounded-xl"><table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-slate-50 border-b border-slate-200 text-slate-600"><tr><th className="py-3 px-4 font-bold">Fecha</th><th className="py-3 px-4 font-bold">Destinatario</th><th className="py-3 px-4 font-bold text-right">Costo Original</th><th className="py-3 px-4 font-bold text-right">Ya Abonado</th><th className="py-3 px-4 font-bold text-right text-rose-600">Deuda Restante</th><th className="py-3 px-4 font-bold text-center">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{pedidosEnDeuda.map(pedido =>{
                                                    const costoOriginal = pedido.precio_envio;
                                                    const abonadoHastaAhora = pedido.monto_abonado || 0;
                                                    const restante = costoOriginal - abonadoHastaAhora;

                                                    return (<tr key={pedido.id} className="hover:bg-slate-50 transition-colors"><td className="py-3 px-4 font-semibold text-slate-800">{new Date(pedido.fecha_registro).toLocaleDateString()}</td><td className="py-3 px-4 text-slate-700">{pedido.destinatario_nombre}</td><td className="py-3 px-4 text-right text-slate-500">${costoOriginal.toFixed(2)}</td><td className="py-3 px-4 text-right text-emerald-600 font-bold">${abonadoHastaAhora.toFixed(2)}</td><td className="py-3 px-4 text-right font-black text-rose-600">${restante.toFixed(2)}</td><td className="py-3 px-4 text-center"><button onClick={() =>setComprobanteActivo(pedido)} className="text-indigo-500"></button></td></tr>);
                                                })}</tbody></table></div></>)}</div>)}</>)}</div></>);
};
