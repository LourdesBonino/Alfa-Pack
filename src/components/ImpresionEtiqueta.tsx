import React, { useEffect } from 'react';
import type { Cliente, Pedido } from '../types/database';

interface Props {
    cliente: Cliente | null;
    pedido: Partial<Pedido>;
    onClose?: () => void;
}

export const ImpresionEtiqueta: React.FC<Props> = ({ cliente, pedido, onClose }) => {
    useEffect(() => {
        if (!onClose) return;
        const handleAfterPrint = () => {
            onClose();
        };
        window.addEventListener('afterprint', handleAfterPrint);

        const timer = setTimeout(() => {
            window.print();
            setTimeout(onClose, 2000);
        }, 500);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [onClose]);

    if (!cliente || !pedido) return null;
    if (pedido.condicion === 'contra_rembolso') return null;

    const bultos = pedido.cantidad_bultos || 1;

    return (
        <>
            <style type="text/css" media="print">
                {`
                    @page {
                        size: A4;
                        margin: 5mm;
                    }
                    body {
                        margin: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                `}
            </style>
            <div className="hidden print:flex print:w-full print:bg-white text-black bg-white justify-center">
                <div className="flex flex-wrap gap-2 w-full max-w-[210mm] justify-start content-start">
                    {Array.from({ length: bultos }).map((_, index) => {
                        const shortId = String(pedido.id || '00000000').split('-')[0].toUpperCase();
                        const bultoText = bultos > 1 ? `BULTO ${index + 1} DE ${bultos}` : `BULTO 1 DE 1`;
                        
                        const remitente = (cliente.nombre_razon_social || '').toUpperCase();
                        const remitenteDir = `${cliente.direccion || ''}, ${cliente.localidad || ''}`.toUpperCase();
                        
                        const destinatario = (pedido.destinatario_nombre || '').toUpperCase();
                        const dirEntrega = pedido.entrega_en_oficina ? 'RETIRA EN SUC. RIO CUARTO' : (pedido.direccion_entrega || 'SIN DIRECCION').toUpperCase();
                        
                        const condicion = (pedido.condicion || '').replace('_', ' ').toUpperCase();

                        return (
                            <div key={index} className="relative print:m-0 box-border inline-block align-top overflow-hidden" style={{ pageBreakInside: 'avoid', width: '96mm', height: '140mm', padding: '1mm' }}>
                                <div className="border-[3px] border-black font-sans bg-white h-full w-full flex flex-col mb-0 box-border p-3 overflow-hidden">
                                    
                                    {/* Header */}
                                    <div className="flex justify-between items-start border-b-[3px] border-black pb-2 mb-2">
                                        <div>
                                            <h1 className="text-3xl font-black italic tracking-tighter leading-none text-black">ALFA<span className="text-gray-600">PACK</span></h1>
                                            <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-black">LOGISTICA</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <span className="text-sm font-black border-[3px] border-black px-2 py-1 rounded-md leading-none text-black">
                                                {condicion}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Remitente */}
                                    <div className="mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block leading-none">REMITENTE:</span>
                                        <h2 className="text-xl font-black mt-1 leading-tight truncate text-black">{remitente}</h2>
                                        <p className="text-xs font-bold leading-tight truncate text-black">{remitenteDir}</p>
                                    </div>

                                    <div className="border-t-[3px] border-black my-1"></div>

                                    {/* Destinatario */}
                                    <div className="mb-1 flex-grow">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block leading-none">DESTINATARIO:</span>
                                        <h2 className="text-3xl font-black mt-1.5 leading-tight line-clamp-2 text-black">{destinatario}</h2>
                                        <p className="text-lg mt-1.5 leading-tight font-black text-black">{dirEntrega}</p>
                                        <div className="mt-3"><span className="text-lg font-black text-black uppercase bg-gray-200 inline-block px-3 py-1 rounded border-2 border-black">{bultoText}</span></div>
                                    </div>

                                    {/* Valores */}
                                    {pedido.condicion === 'contra_rembolso' && (
                                        <div className="bg-gray-200 p-2 border-[3px] border-black mt-auto flex justify-between items-center">
                                            <span className="text-xs font-black uppercase text-black">COBRAR:</span>
                                            <span className="text-xl font-black text-black">${(pedido.valor_mercaderia || 0) + (pedido.precio_envio || 0)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};
