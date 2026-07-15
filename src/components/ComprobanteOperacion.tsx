import React, { useEffect } from 'react';
import type { Pedido, Cliente } from '../types/database';

type PedidoConCliente = Pedido & { clientes: Cliente, destinatario?: Cliente | null };

interface Props {
    pedido: PedidoConCliente;
    onClose: () =>void;
}

export const ComprobanteOperacion = ({ pedido, onClose }: Props) =>{
    useEffect(() =>{
        const handleAfterPrint = () =>{
            onClose();
        };
        window.addEventListener('afterprint', handleAfterPrint);

        const timer = setTimeout(() =>{
            window.print();
            // Para navegadores antiguos o si se cancela muy rápido
            setTimeout(onClose, 2000); // Fallback: si no cierra en 2 segundos, forzamos cierre para destrabar la UI (aunque el diálogo pause JS, si no pausa o si falla el evento, se cierra)
        }, 100);

        return () =>{
            clearTimeout(timer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [onClose]);

    const getEstadoCobro = () =>{
        if (pedido.estado.includes('finalizado')) {
            return { texto: 'ABONADO', color: 'bg-green-100 text-green-800 border-green-400' };
        }
        if (pedido.forma_cobro.includes('cuenta_corriente')) {
            return { texto: 'A CTA CTE', color: 'bg-blue-100 text-blue-800 border-blue-400' };
        }
        return { texto: 'A ABONAR', color: 'bg-red-100 text-red-800 border-red-400' };
    };
    
    const estadoCobro = getEstadoCobro();

    const renderTicket = (tipo: 'ORIGINAL' | 'DUPLICADO') => (
        <div className="w-full relative overflow-hidden bg-white h-auto sm:h-[14.5cm] flex flex-col justify-between print:m-0 print:p-2 border-b-2 border-dashed border-gray-400 mb-4 pb-4 print:border-b-2 print:border-black print:mb-0 print:pb-2 box-border print:break-inside-avoid">
            {/* Sello de agua */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none overflow-hidden z-0">
                <span className="text-[120px] font-black uppercase rotate-[-30deg] tracking-widest">{tipo}</span>
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-3">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter leading-none">ALFA<span className="text-gray-500">PACK</span></h1>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Servicio de Logística</p>
                        <p className="text-[10px] font-semibold text-gray-500 mt-1 uppercase">Bv. Alte. Brown 362 - General Deheza<br/>Tel: 358-4387150 / 358-4226587</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border border-black rounded">{tipo}</span>
                            <h2 className="text-xl font-black uppercase tracking-widest">Guía de Transporte</h2>
                        </div>
                        <div className="bg-gray-100 border border-gray-300 px-3 py-1 rounded">
                            <p className="text-[10px] uppercase font-bold text-gray-500">Operación N°</p>
                            <p className="text-lg font-mono font-black">#{String(pedido.id).split('-')[0].toUpperCase()}</p>
                        </div>
                        <p className="text-xs font-bold mt-1">Fecha: {new Date(pedido.fecha_ejecucion + 'T12:00:00').toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Remitente & Destinatario */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                    {/* Remitente */}
                    <div className="border-2 border-black rounded-lg p-3">
                        <h3 className="bg-black text-white print:bg-white print:text-black print:border print:border-black text-[10px] font-black uppercase tracking-widest px-2 py-0.5 inline-block rounded mb-1 -mt-6">Remitente</h3>
                        <p className="font-black text-base leading-tight uppercase">{pedido.clientes?.nombre_razon_social}</p>
                        <p className="mt-1 text-xs">{pedido.clientes?.direccion || 'Sin dirección'}</p>
                        <p className="text-xs">{pedido.clientes?.localidad || 'Sin localidad'}</p>
                        <p className="mt-1 text-xs font-bold">{pedido.clientes?.telefono || 'Sin Teléfono'}</p>
                    </div>
                    
                    {/* Destinatario */}
                    <div className="border-2 border-black rounded-lg p-3">
                        <h3 className="bg-black text-white print:bg-white print:text-black print:border print:border-black text-[10px] font-black uppercase tracking-widest px-2 py-0.5 inline-block rounded mb-1 -mt-6">Destinatario</h3>
                        <p className="font-black text-base leading-tight uppercase">{pedido.destinatario_nombre}</p>
                        <p className="mt-1 text-xs leading-tight line-clamp-2">
                            {pedido.condicion === 'retirar' ? (pedido.retiro_en_sucursal ? 'RETIRO EN SUCURSAL (RÍO CUARTO)' : (pedido.direccion_retiro || pedido.destinatario?.direccion || 'Sin dirección de retiro')) : (pedido.entrega_en_oficina ? 'RETIRA POR SUCURSAL (RÍO CUARTO)' : (pedido.direccion_entrega || pedido.destinatario?.direccion || 'Sin dirección de entrega'))}
                        </p>
                        {pedido.destinatario && <p className="text-xs mt-0.5">{pedido.destinatario.localidad || 'Sin localidad'}</p>}
                        {pedido.destinatario && <p className="mt-1 text-xs font-bold">{pedido.destinatario.telefono || 'Sin Teléfono'}</p>}
                    </div>
                </div>

                {/* Detalles de Operación */}
                <div className="border-2 border-black rounded-lg mb-3 overflow-hidden flex-shrink-0">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 border-b-2 border-black text-[10px] uppercase">
                            <tr>
                                <th className="p-2 border-r border-black font-black w-1/3">Tipo de Servicio</th>
                                <th className="p-2 border-r border-black font-black w-1/6 text-center">Bultos</th>
                                <th className="p-2 font-black">Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-2 border-r border-black font-bold uppercase text-xs">{pedido.condicion.replace('_', ' ')}</td>
                                <td className="p-2 border-r border-black font-bold text-center text-sm">{pedido.cantidad_bultos || 1}</td>
                                <td className="p-2 italic text-xs line-clamp-2 leading-tight">{pedido.observaciones || '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Importes */}
                <div className="grid grid-cols-2 gap-4 mb-2 flex-grow">
                    {/* Firma Receptor */}
                    <div className="border-2 border-gray-300 rounded-lg p-3 flex flex-col justify-end items-center relative min-h-[80px]">
                        <span className="absolute top-1 left-2 text-[10px] uppercase font-bold text-gray-400">Recibí Conforme</span>
                        <div className="w-3/4 border-b border-black mb-1"></div>
                        <p className="text-[9px] uppercase font-bold text-gray-500">Firma, Aclaración y DNI</p>
                    </div>
                    
                    {/* Costos */}
                    <div className="border-2 border-black rounded-lg p-2 bg-gray-50 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold uppercase text-gray-600">Estado / Cobro:</span>
                            <div className="flex flex-col items-end gap-0.5">
                                <span className={`border px-2 py-0.5 text-xs uppercase font-black rounded leading-none ${estadoCobro.color}`}>{estadoCobro.texto}</span>
                                <span className="text-[9px] uppercase font-bold text-gray-500">En: {pedido.forma_cobro.replace(/_/g, ' ')}</span>
                            </div>
                        </div>
                        <div className="border-t border-gray-300 my-1"></div>
                        <div className="flex justify-between items-center mb-1 text-xs">
                            <span className="font-bold text-gray-700">Costo de Envío:</span>
                            <span className="font-mono">${pedido.precio_envio.toFixed(2)}</span>
                        </div>
                        {pedido.condicion === 'contra_rembolso' && (
                            <div className="flex justify-between items-center mb-1 text-xs">
                                <span className="font-bold text-gray-700">Valor Mercadería:</span>
                                <span className="font-mono">${pedido.valor_mercaderia.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="border-t-2 border-black mt-1 pt-1 flex justify-between items-center">
                            <span className="font-black uppercase text-sm">Total:</span>
                            <span className="font-black font-mono text-base">
                                {pedido.condicion === 'contra_rembolso' 
                                    ? `$${(pedido.precio_envio + pedido.valor_mercaderia).toFixed(2)}`
                                    : `$${pedido.precio_envio.toFixed(2)}`
                                }
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-[9px] text-gray-400 border-t border-gray-200 pt-1 mt-auto">Documento generado por Alfa Pack - Sistema Operativo Interno</div>
            </div>
        </div>
    );

    return (
        <>
            <style type="text/css" media="print">
                {`
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                `}
            </style>
            <div className="hidden print:block print:w-full print:bg-white overflow-hidden box-border">
                {renderTicket('ORIGINAL')}
                {renderTicket('DUPLICADO')}
            </div>
        </>
    );
};
