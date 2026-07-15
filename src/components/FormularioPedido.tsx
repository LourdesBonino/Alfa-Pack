import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { CondicionPedido, Cliente, Pedido, FormaCobro } from '../types/database';
import { SelectorCliente } from './SelectorCliente';
import { ComprobanteOperacion } from './ComprobanteOperacion';
import { ImpresionEtiqueta } from './ImpresionEtiqueta';

export const FormularioPedido = () =>{
    const [condicion, setCondicion] = useState<CondicionPedido>('retirar');
    const [destinatario, setDestinatario] = useState('');
    const [destinatarioId, setDestinatarioId] = useState<string | null>(null);
    const [observaciones, setObservaciones] = useState('');
    const [montoEnvio, setMontoEnvio] = useState<number>(0);
    const [montoMercaderia, setMontoMercaderia] = useState<number>(0);
    const hoy = new Date().toISOString().split('T')[0];
    const [fechaEjecucion, setFechaEjecucion] = useState(hoy);
    const [clienteId, setClienteId] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [retiroEnSucursal, setRetiroEnSucursal] = useState(false);
    const [direccionRetiro, setDireccionRetiro] = useState('');
    const [entregaEnOficina, setEntregaEnOficina] = useState(false);
    const [direccionEntrega, setDireccionEntrega] = useState('');
    const [formaCobro, setFormaCobro] = useState<FormaCobro>('origen');
    const [cantidadBultos, setCantidadBultos] = useState(1);
    const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' | 'advertencia' } | null>(null);
    const [ultimoPedido, setUltimoPedido] = useState<Pedido | null>(null);
    const [datosCliente, setDatosCliente] = useState<Cliente | null>(null);
    const [imprimiendo, setImprimiendo] = useState<'guia' | 'etiqueta' | null>(null);
    
    // Calculo por Porcentaje
    const [calcularConPorcentaje, setCalcularConPorcentaje] = useState(false);
    const [valorMercaderiaCalculo, setValorMercaderiaCalculo] = useState<number>(0);

    // Efecto para autocalcular el envío si se usa porcentaje
    React.useEffect(() =>{
        if (calcularConPorcentaje && datosCliente?.comision_porcentaje && condicion === 'retirar') {
            const calculado = valorMercaderiaCalculo * (datosCliente.comision_porcentaje / 100);
            setMontoEnvio(Number(calculado.toFixed(2)));
        }
    }, [valorMercaderiaCalculo, calcularConPorcentaje, datosCliente, condicion]);

    // Effect to fetch client data when selected
    React.useEffect(() =>{
        if (!clienteId) {
            setDatosCliente(null);
            return;
        }
        const fetchCliente = async () =>{
            const { data } = await supabase.from('clientes').select('*').eq('id', clienteId).single();
            if (data) {
                setDatosCliente(data);
            }
        };
        fetchCliente();
    }, [clienteId]);

    const mostrarToast = (mensaje: string, tipo: 'exito' | 'error' | 'advertencia') =>{
        setToast({ mensaje, tipo });
        setTimeout(() =>setToast(null), 4000);
    };

    const guardarPedido = async (e: React.FormEvent) =>{
        e.preventDefault();
        
        if (!clienteId) {
            mostrarToast("️ Por favor, selecciona un cliente para continuar.", "advertencia");
            return;
        }

        if (!destinatario.trim()) {
            mostrarToast("️ Debes ingresar el nombre del destinatario.", "advertencia");
            return;
        }

        if (montoEnvio<= 0) {
            mostrarToast("️ El costo de envío debe ser mayor a $0.", "advertencia");
            return;
        }

        if (condicion === 'contra_rembolso' && montoMercaderia<= 0) {
            mostrarToast("️ Para Contra Reembolso, especifica el valor de la mercadería.", "advertencia");
            return;
        }

        setCargando(true);

        const { data: pedido, error: errorPedido } = await supabase
            .from('pedidos')
            .insert([
                { 
                    cliente_id: clienteId,
                    destinatario_id: destinatarioId,
                    destinatario_nombre: destinatario.trim(),
                    condicion: condicion,
                    observaciones: observaciones.trim() || null,
                    precio_envio: montoEnvio, 
                    valor_mercaderia: condicion === 'contra_rembolso' ? montoMercaderia : 0,
                    fecha_ejecucion: fechaEjecucion,
                    estado: 'programado',
                    retiro_en_sucursal: condicion !== 'entregar' ? retiroEnSucursal : false,
                    direccion_retiro: (condicion !== 'entregar' && !retiroEnSucursal) ? direccionRetiro.trim() : null,
                    entrega_en_oficina: entregaEnOficina,
                    direccion_entrega: !entregaEnOficina ? direccionEntrega.trim() : null,
                    forma_cobro: condicion === 'contra_rembolso' ? 'destino' : formaCobro,
                    abonado: (condicion === 'contra_rembolso' ? 'destino' : formaCobro) === 'origen',
                    monto_abonado: formaCobro === 'origen' ? montoEnvio : 0,
                    cantidad_bultos: cantidadBultos
                }
            ])
            .select()
            .single();

        if (errorPedido) {
            console.error("Error completo de Supabase:", errorPedido);
            mostrarToast(" Error al guardar: " + errorPedido.message, "error");
            setCargando(false);
            return;
        }

        setUltimoPedido(pedido);
        
        setUltimoPedido(pedido);
        
        mostrarToast(` ¡Operación registrada con éxito! Generando guía de transporte...`, "exito");
        
        // Limpiar campos
        setDestinatario('');
        setDestinatarioId(null);
        setObservaciones('');
        setMontoEnvio(0);
        setMontoMercaderia(0);
        setRetiroEnSucursal(false);
        setDireccionRetiro('');
        setEntregaEnOficina(false);
        setDireccionEntrega('');
        setFormaCobro('origen');
        setCantidadBultos(1);
        setCalcularConPorcentaje(false);
        setValorMercaderiaCalculo(0);
        setCargando(false);
    };

    return (<div className="w-full relative">{/* NOTIFICACIONES TOAST FLOTANTES */}
            {toast && (<div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-md animate-fade-in-up print:hidden ${
                    toast.tipo === 'exito' ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-200' :
                    toast.tipo === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-200' :
                    'bg-amber-950/90 border-amber-500/30 text-amber-200'
                }`}><div className="shrink-0">{toast.tipo === 'exito' && (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>)}
                        {toast.tipo === 'error' && (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-rose-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>)}
                        {toast.tipo === 'advertencia' && (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-400"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>)}</div><span className="text-sm font-semibold tracking-wide">{toast.mensaje}</span></div>)}<div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden print:hidden"><form onSubmit={guardarPedido} className="flex flex-col gap-6"><div><span className="text-[10px] font-bold brand-primary-text uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">Operación Logística</span><h2 className="text-xl md:text-2xl font-black text-slate-800 mt-2 tracking-tight">Registrar Nuevo Recorrido</h2></div>{/* Selector de Cliente */}<div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200 z-20 relative"><SelectorCliente 
                            onSelect={(id) =>setClienteId(id)} 
                        /></div>{/* Destinatario */}<div className="flex flex-col gap-2 relative z-10">{condicion === 'entregar' ? (<div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200"><SelectorCliente 
                                    onSelect={(id) =>setDestinatarioId(id)}
                                    label="Destinatario"
                                    allowFreeText={true}
                                    onFreeTextChange={setDestinatario}
                                    freeTextValue={destinatario}
                                /></div>) : (<><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Destinatario</label><div className="relative"><span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></span><input 
                                        type="text" 
                                        placeholder="Nombre del destinatario..."
                                        className="brand-input pl-11 pr-4 py-3 rounded w-full text-sm font-semibold"
                                        value={destinatario}
                                        onChange={(e) =>{
                                            setDestinatario(e.target.value);
                                            setDestinatarioId(null);
                                        }}
                                    /></div></>)}</div>{/* Fecha de Ejecución */}<div className="flex flex-col gap-2"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Fecha de Ejecución</label><input
                            type="date"
                            className="brand-input px-4 py-3 rounded text-sm font-semibold w-full bg-slate-50"
                            value={fechaEjecucion}
                            onChange={(e) =>setFechaEjecucion(e.target.value)}
                        /><p className="text-[10px] text-slate-500 mt-1">El envío aparecerá en la planilla correspondiente a esta fecha.</p></div>{/* Condiciones */}<div className="flex flex-col gap-3"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Condición del Envío</label><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><button
                                type="button"
                                onClick={() =>{ setCondicion('retirar'); }}
                                className={`flex flex-col items-start p-3.5 rounded border text-left transition-all duration-200 relative overflow-hidden ${
                                    condicion === 'retirar' 
                                        ? 'bg-blue-50/50 border-[#0046b0] text-[#0038a8] shadow-sm' 
                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100/50'
                                }`}
                            ><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 ${condicion === 'retirar' ? 'bg-[#0046b0] text-white' : 'bg-slate-200 text-slate-500'}`}>RETIRAR</span><span className="text-sm font-extrabold block text-slate-800">Retirar paquete</span><span className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">El cliente solicita traerle una encomienda desde un punto específico.</span></button><button
                                type="button"
                                onClick={() =>{ setCondicion('entregar'); }}
                                className={`flex flex-col items-start p-3.5 rounded border text-left transition-all duration-200 relative overflow-hidden ${
                                    condicion === 'entregar' 
                                        ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-sm' 
                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100/50'
                                }`}
                            ><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 ${condicion === 'entregar' ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'}`}>ENTREGAR</span><span className="text-sm font-extrabold block text-slate-800">Entregar Paquete</span><span className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">El cliente ya trajo el paquete para entregar.</span></button><button
                                type="button"
                                onClick={() =>{ setCondicion('contra_rembolso'); }}
                                className={`flex flex-col items-start p-3.5 rounded border text-left transition-all duration-200 relative overflow-hidden ${
                                    condicion === 'contra_rembolso' 
                                        ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm' 
                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100/50'
                                }`}
                            ><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 ${condicion === 'contra_rembolso' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>C. REMBOLSO</span><span className="text-sm font-extrabold block text-slate-800">Contra Rembolso</span><span className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">Se cobra el producto al destinatario final.</span></button></div></div>{/* Opciones Adicionales de Retiro y Entrega */}<div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in-up">{condicion !== 'entregar' && (<><div className="flex items-center gap-3"><input 
                                        type="checkbox" 
                                        id="retiroSucursal" 
                                        className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                                        checked={retiroEnSucursal}
                                        onChange={(e) =>setRetiroEnSucursal(e.target.checked)}
                                    /><label htmlFor="retiroSucursal" className="text-sm font-bold text-slate-700 cursor-pointer select-none">Retiro en sucursal Río Cuarto</label></div>{!retiroEnSucursal && (<div className="flex flex-col gap-2 mt-2 border-t border-slate-200 pt-3"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Dirección de Retiro</label><input 
                                            type="text" 
                                            placeholder="Dirección de retiro"
                                            className="brand-input px-4 py-2.5 rounded w-full text-sm font-semibold text-slate-800"
                                            value={direccionRetiro}
                                            onChange={(e) =>setDireccionRetiro(e.target.value)}
                                        /></div>)}</>)}

                        {/* Opciones de Entrega */}<div className={`flex flex-col gap-3 ${condicion !== 'entregar' ? 'mt-2 border-t border-slate-200 pt-3' : ''}`}><span className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">{condicion === 'entregar' ? 'Opciones de Entrega' : 'Opciones de Entrega (Turno Tarde)'}</span><div className="flex items-center gap-3"><input 
                                    type="checkbox" 
                                    id="entregaOficina" 
                                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                                    checked={entregaEnOficina}
                                    onChange={(e) =>setEntregaEnOficina(e.target.checked)}
                                /><label htmlFor="entregaOficina" className="text-sm font-bold text-slate-700 cursor-pointer select-none">Se retira por sucursal Alfa Pack</label></div>{!entregaEnOficina && (<div className="flex flex-col gap-2 mt-1"><label className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Dirección de Entrega</label><input 
                                        type="text" 
                                        placeholder={condicion === 'entregar' ? 'Dirección de entrega' : 'Dirección para entregar a la tarde'}
                                        className="brand-input px-4 py-2.5 rounded w-full text-sm font-semibold text-slate-800"
                                        value={direccionEntrega}
                                        onChange={(e) =>setDireccionEntrega(e.target.value)}
                                    /></div>)}</div></div>{/* Forma de Cobro */}
                    {condicion !== 'contra_rembolso' && (<div className="flex flex-col gap-2"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Forma de Cobro del Envío</label><div className="flex gap-4"><label className="flex items-center gap-2 cursor-pointer"><input 
                                    type="radio" 
                                    name="formaCobro" 
                                    value="origen"
                                    checked={formaCobro === 'origen'}
                                    onChange={(e) =>setFormaCobro(e.target.value as FormaCobro)}
                                    className="accent-[#0046b0] w-4 h-4"
                                /><span className="text-sm font-semibold text-slate-700">{condicion === 'retirar' ? "Abona al generar envío" : 
                                     condicion === 'entregar' ? "Paga Remitente (Efectivo)" : 
                                     "Paga Remitente (Origen)"}</span></label>{condicion !== 'retirar' && (<label className="flex items-center gap-2 cursor-pointer"><input 
                                        type="radio" 
                                        name="formaCobro" 
                                        value="cuenta_corriente"
                                        checked={formaCobro === 'cuenta_corriente'}
                                        onChange={(e) =>setFormaCobro(e.target.value as FormaCobro)}
                                        className="accent-[#0046b0] w-4 h-4"
                                    /><span className="text-sm font-semibold text-slate-700">{condicion === 'entregar' ? "Paga Remitente (Cta Cte)" : "Cuenta Corriente"}</span></label>)}<label className="flex items-center gap-2 cursor-pointer"><input 
                                    type="radio" 
                                    name="formaCobro" 
                                    value="destino"
                                    checked={formaCobro === 'destino'}
                                    onChange={(e) =>setFormaCobro(e.target.value as FormaCobro)}
                                    className="accent-[#0046b0] w-4 h-4"
                                /><span className="text-sm font-semibold text-slate-700">{condicion === 'retirar' ? "Abona al entregar" : 
                                     condicion === 'entregar' ? "Paga Destinatario" :
                                     "Paga Destinatario (Destino)"}</span></label></div></div>)}

                    {/* Calculo por Porcentaje */}
                    {condicion === 'retirar' && datosCliente && datosCliente.comision_porcentaje >0 && (<div className="flex flex-col gap-2 p-4 bg-blue-50/50 border border-blue-200 rounded-2xl animate-fade-in-up"><label className="flex items-center gap-3 cursor-pointer"><input 
                                    type="checkbox" 
                                    className="w-5 h-5 accent-[#0046b0] rounded"
                                    checked={calcularConPorcentaje}
                                    onChange={(e) =>setCalcularConPorcentaje(e.target.checked)}
                                /><span className="font-bold text-sm text-slate-700">Calcular envío con porcentaje ({datosCliente.comision_porcentaje}%)</span></label>{calcularConPorcentaje && (<div className="mt-3"><label className="font-extrabold text-xs text-[#0038a8] uppercase tracking-wider">Valor de la Mercadería ($)</label><div className="relative mt-1"><span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0046b0] font-bold text-sm">$</span><input
                                            type="number"
                                            placeholder="Ingrese el valor para calcular el envío"
                                            className="brand-input pl-8 pr-4 py-3 border-blue-300 focus:border-blue-500 rounded w-full text-sm font-semibold text-slate-800 bg-white"
                                            value={valorMercaderiaCalculo || ''}
                                            onChange={(e) =>setValorMercaderiaCalculo(Number(e.target.value))} 
                                            min="0"
                                        /></div><p className="text-[10px] text-[#0046b0] mt-1.5 font-semibold leading-relaxed">Al ingresar el valor, el<strong>Costo del Envío</strong>se autocompletará debajo.</p></div>)}</div>)}

                    {/* Costo y Cantidad */}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="flex flex-col gap-2"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Costo del Envío ($)</label><div className="relative"><span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">$</span><input
                                    type="number"
                                    placeholder="0.00"
                                    className={`brand-input pl-8 pr-4 py-3 rounded w-full text-sm font-semibold ${calcularConPorcentaje ? 'bg-slate-100 text-slate-500' : ''}`}
                                    value={montoEnvio || ''}
                                    onChange={(e) =>setMontoEnvio(Number(e.target.value))} 
                                    min="0"
                                    readOnly={calcularConPorcentaje}
                                /></div></div><div className="flex flex-col gap-2"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Cantidad de Bultos</label><div className="relative"><span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm"></span><input
                                    type="number"
                                    placeholder="1"
                                    className="brand-input pl-9 pr-4 py-3 rounded w-full text-sm font-semibold"
                                    value={cantidadBultos || ''}
                                    onChange={(e) =>setCantidadBultos(Number(e.target.value))} 
                                    min="1"
                                /></div></div></div>{/* Monto de Mercadería */}
                    {condicion === 'contra_rembolso' && (<div className="flex flex-col gap-2 p-4 bg-amber-50/50 border border-amber-200 rounded-2xl animate-fade-in-up"><div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-600 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7.25-3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9 9a.75.75 0 111.5 0v4.5a.75.75 0 11-1.5 0V9z" clipRule="evenodd" /></svg><label className="font-extrabold text-xs text-amber-800 uppercase tracking-wider">Valor de la Mercadería ($)</label></div><div className="relative mt-1"><span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-600 font-bold text-sm">$</span><input
                                    type="number"
                                    placeholder="Ingrese el monto a cobrar al destinatario"
                                    className="brand-input pl-8 pr-4 py-3 border-amber-300 focus:border-amber-500 rounded w-full text-sm font-semibold text-slate-800"
                                    value={montoMercaderia || ''}
                                    onChange={(e) =>setMontoMercaderia(Number(e.target.value))} 
                                    min="0"
                                /></div><p className="text-[10px] text-amber-700 leading-normal mt-1 font-semibold">El repartidor cobrará la suma del envío más este valor al entregar.</p></div>)}

                    {/* Observaciones */}<div className="flex flex-col gap-2"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Observaciones (Opcional)</label><textarea
                            placeholder="Ej. Tocar timbre fuerte, cuidado frágil..."
                            className="brand-input px-4 py-3 rounded text-sm font-semibold w-full resize-none h-20"
                            value={observaciones}
                            onChange={(e) =>setObservaciones(e.target.value)}
                        /></div>{/* Botón de Enviar (ROJO CORPORATIVO) */}<button
                        type="submit"
                        disabled={cargando}
                        className={`mt-2 py-4.5 rounded font-bold text-sm tracking-wide shadow-md transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 brand-accent-bg cursor-pointer ${
                            cargando ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >{cargando ? (<><svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span>PROCESANDO RECORRIDO...</span></>) : (<><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg><span>GUARDAR Y REGISTRAR COBRO</span></>)}</button></form></div>{/* Componente de Guía de Transporte para Impresión */}
            {/* Modal de Impresión Exitoso */}
            {ultimoPedido && datosCliente && !imprimiendo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative flex flex-col items-center text-center animate-fade-in-up">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-black mb-2 text-slate-800">¡Operación Guardada!</h3>
                        <p className="text-sm text-slate-500 mb-6 font-medium">El pedido ha sido registrado correctamente.</p>
                        
                        <div className="flex flex-col gap-3 w-full">
                            <button 
                                onClick={() => setImprimiendo('guia')}
                                className="w-full bg-[#0046b0] text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-[#0038a8] transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                                Imprimir Guía (A4)
                            </button>
                            
                            <button 
                                onClick={() => setImprimiendo('etiqueta')}
                                className="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H14a1 1 0 100-2H8.414l1.293-1.293z" clipRule="evenodd" /></svg>
                                Imprimir Etiquetas (10x15)
                            </button>
                            
                            <button 
                                onClick={() => { setUltimoPedido(null); setImprimiendo(null); }}
                                className="w-full bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-300 transition-colors mt-2"
                            >
                                Cerrar y Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ultimoPedido && datosCliente && imprimiendo === 'guia' && (
                <ComprobanteOperacion 
                    pedido={{ ...ultimoPedido, clientes: datosCliente }}
                    onClose={() => setImprimiendo(null)}
                />
            )}

            {ultimoPedido && datosCliente && imprimiendo === 'etiqueta' && (
                <ImpresionEtiqueta 
                    cliente={datosCliente} 
                    pedido={ultimoPedido} 
                    onClose={() => setImprimiendo(null)}
                />
            )}
        </div>
    );
};