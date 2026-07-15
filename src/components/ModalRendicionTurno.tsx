import React from 'react';
import type { Pedido, Cliente } from '../types/database';

type PedidoConCliente = Pedido & { clientes: Cliente };

interface Props {
    pedidos: PedidoConCliente[];
    onResolver: (pedido: PedidoConCliente, tipoCobro: 'efectivo' | 'cuenta_corriente' | 'ya_abonado') =>Promise<void>;
    onClose: () =>void;
    cargando?: boolean;
}

export const ModalRendicionTurno = ({ pedidos, onResolver, onClose, cargando = false }: Props) =>{
    return (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"><div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative overflow-y-auto max-h-[90vh]"><div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Rendición de Cobros</h2><p className="text-sm text-slate-500 mt-1">Faltan {pedidos.length} envíos por detallar el cobro antes de cerrar.</p></div><button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div><div className="flex flex-col gap-3">{pedidos.map(pedido =>(<div key={pedido.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-black text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">#{String(pedido.id).split('-')[0].toUpperCase()}</span><span className="text-[10px] font-bold text-teal-600 bg-teal-100 uppercase tracking-wider px-2 py-0.5 rounded">ENTREGADO</span></div><h4 className="font-bold text-slate-800 text-sm">Destinatario: {pedido.destinatario_nombre}</h4><p className="text-xs text-slate-500 font-semibold mt-1">Monto del Envío:<span className="text-emerald-600 font-black">${pedido.precio_envio}</span><span className="text-slate-400 mx-1">•</span>Forma original:<span className="uppercase text-slate-600">{pedido.forma_cobro.replace(/_/g, ' ')}</span></p></div><div className="flex flex-wrap gap-2 md:w-auto w-full shrink-0">{(pedido.forma_cobro === 'origen' || pedido.forma_cobro === 'cuenta_corriente') ? (<button 
                                        disabled={cargando}
                                        onClick={() =>onResolver(pedido, 'ya_abonado')} 
                                        className="flex-1 md:flex-none bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold py-2 px-4 rounded transition-colors border border-emerald-200 disabled:opacity-50"
                                    >Cerrar ({pedido.forma_cobro === 'origen' ? 'Ya Abonado' : 'Cta. Cte.'})</button>) : (<><button 
                                            disabled={cargando}
                                            onClick={() =>onResolver(pedido, 'efectivo')} 
                                            className="flex-1 md:flex-none bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold py-2 px-4 rounded transition-colors border border-emerald-200 disabled:opacity-50"
                                        >Cobro Efectivo</button><button 
                                            disabled={cargando}
                                            onClick={() =>onResolver(pedido, 'cuenta_corriente')} 
                                            className="flex-1 md:flex-none bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold py-2 px-4 rounded transition-colors border border-purple-200 disabled:opacity-50"
                                        >Pasa a Cta Cte</button></>)}</div></div>))}</div></div></div>);
};
