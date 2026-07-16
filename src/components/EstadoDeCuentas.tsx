import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DeudorInfo {
    clienteId: string;
    nombre: string;
    localidad: string;
    cantidadViajes: number;
    deudaTotal: number;
}

export const EstadoDeCuentas = () =>{
    const [deudores, setDeudores] = useState<DeudorInfo[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() =>{
        const fetchDeudores = async () =>{
            setCargando(true);
            
            // Traer todos los pedidos en deuda, incluyendo datos del cliente relacionado
            const { data, error } = await supabase
                .from('pedidos')
                .select(`
                    id, 
                    precio_envio, 
                    monto_abonado,
                    forma_cobro,
                    cliente_id,
                    clientes!pedidos_cliente_id_fkey (id, nombre_razon_social, localidad),
                    destinatario_id,
                    destinatario_clientes:clientes!pedidos_destinatario_id_fkey (id, nombre_razon_social, localidad)
                `)
                .or('forma_cobro.eq.cuenta_corriente,forma_cobro.eq.cuenta_corriente_destino')
                .eq('abonado', false);

            if (error || !data) {
                console.error("Error obteniendo deudas:", error);
                setCargando(false);
                return;
            }

            // Agrupar por cliente
            const deudoresMap = new Map<string, DeudorInfo>();

            data.forEach((pedido: any) =>{
                const esDeudaDestino = pedido.forma_cobro === 'cuenta_corriente_destino';
                const cliente = esDeudaDestino ? pedido.destinatario_clientes : pedido.clientes;

                if (!cliente) return; // Por si hay un pedido huerfano

                const costoTotal = pedido.precio_envio || 0;
                const abonado = pedido.monto_abonado || 0;
                const deudaRestante = costoTotal - abonado;

                if (deudaRestante<= 0) return;

                if (deudoresMap.has(cliente.id)) {
                    const info = deudoresMap.get(cliente.id)!;
                    info.cantidadViajes += 1;
                    info.deudaTotal += deudaRestante;
                } else {
                    deudoresMap.set(cliente.id, {
                        clienteId: cliente.id,
                        nombre: cliente.nombre_razon_social,
                        localidad: cliente.localidad || 'Sin localidad',
                        cantidadViajes: 1,
                        deudaTotal: deudaRestante
                    });
                }
            });

            // Convertir a array y ordenar por deuda descendente
            const deudoresList = Array.from(deudoresMap.values()).sort((a, b) =>b.deudaTotal - a.deudaTotal);
            
            setDeudores(deudoresList);
            setCargando(false);
        };

        fetchDeudores();
    }, []);

    const deudaGlobal = deudores.reduce((sum, d) =>sum + d.deudaTotal, 0);

    return (<div className="w-full relative animate-fade-in print:bg-white print:m-0 print:p-0">{/* ENCABEZADO */}<div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md mb-6 print:border-none print:shadow-none print:p-0 print:mb-4"><div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest bg-rose-50 px-2.5 py-1 rounded-full print:hidden">Auditoría</span><h2 className="text-xl md:text-2xl font-black text-slate-800 mt-2 tracking-tight">Estado de Cuentas</h2><p className="text-xs text-slate-500 mt-1">Resumen global de todos los clientes con saldo deudor en Cuenta Corriente.</p></div>{deudores.length >0 && (<button 
                            onClick={() =>window.print()}
                            className="px-4 py-2 bg-slate-800 text-white font-bold text-sm rounded shadow flex items-center gap-2 hover:bg-slate-900 transition-colors print:hidden"
                        ><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0v3.396c0 .611.49 1.109 1.09 1.109h8.32c.6 0 1.09-.498 1.09-1.109V7.034a32.6 32.6 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125H8.25F7.125A1.125 1.125 0 0 0 6 3.375V7.034" /></svg>Imprimir Resumen</button>)}</div><div className="hidden print:block mb-6 border-b-2 border-black pb-2 mt-4 text-center"><h1 className="text-3xl font-black italic tracking-tighter">ALFA<span className="text-gray-500">PACK</span></h1><p className="text-sm font-semibold uppercase mt-1">Dirección: Bv. Alte. Brown 362 - General Deheza | Tel: 358-4387150 / 358-4226587</p><h2 className="text-xl font-bold uppercase mt-2">Reporte General de Saldos</h2><p className="text-sm"><strong>Fecha de emisión:</strong>{new Date().toLocaleDateString()}</p></div></div>{cargando ? (<div className="py-12 flex justify-center text-slate-400 print:hidden"><svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></div>) : deudores.length === 0 ? (<div className="py-12 text-center text-emerald-600 font-bold border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50 print:hidden">¡No hay deudas registradas! Todos los clientes están al día.</div>) : (<div className="flex flex-col xl:flex-row gap-6">{/* TABLA PRINCIPAL */}<div className="flex-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-md print:border-none print:shadow-none print:p-0"><div className="overflow-x-auto"><table className="w-full text-left text-sm whitespace-nowrap print:text-xs"><thead className="bg-slate-50 border-b border-slate-200 text-slate-600 print:bg-transparent print:border-black"><tr><th className="py-3 px-4 font-bold">Cliente / Razón Social</th><th className="py-3 px-4 font-bold">Localidad</th><th className="py-3 px-4 font-bold text-center">Viajes Impagos</th><th className="py-3 px-4 font-bold text-right text-rose-600">Deuda Total</th></tr></thead><tbody className="divide-y divide-slate-100 print:divide-gray-300">{deudores.map((deudor, index) =>(<tr key={deudor.clienteId} className="hover:bg-slate-50 transition-colors print:hover:bg-transparent"><td className="py-3 px-4 text-slate-800"><div className="flex items-center gap-3"><span className="text-xs font-black text-slate-400 w-4">{index + 1}.</span><span className="font-semibold truncate max-w-[200px] print:max-w-none">{deudor.nombre}</span></div></td><td className="py-3 px-4 text-slate-500 text-xs font-semibold">{deudor.localidad}</td><td className="py-3 px-4 text-center"><span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full print:bg-transparent print:p-0 print:text-black">{deudor.cantidadViajes}</span></td><td className="py-3 px-4 text-right font-black text-rose-600">${deudor.deudaTotal.toFixed(2)}</td></tr>))}</tbody></table></div></div>{/* WIDGET TOTAL GLOBAL */}<div className="w-full xl:w-80 flex-shrink-0"><div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-sm sticky top-6 print:border-none print:shadow-none print:bg-transparent print:p-0"><h3 className="text-sm font-black text-rose-800 mb-4 flex items-center gap-2 print:hidden"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.5-3.84v.34a.75.75 0 001.5 0v-.34a.75.75 0 00-1.5 0zm1.5-1.16a.75.75 0 00-.75-.75h-.75a.75.75 0 01-.75-.75v-1.5a.75.75 0 01.75-.75h.75a.75.75 0 00.75-.75v-.36a2.25 2.25 0 00-4.5 0v.36c0 .414.336.75.75.75h.75a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-.75a.75.75 0 00-.75.75v2.34a2.25 2.25 0 004.5 0v-2.34z" clipRule="evenodd" /></svg>Resumen Global</h3><div className="mb-6"><span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest block mb-1">Deuda Total en la Calle</span><span className="text-4xl font-black text-rose-900 tracking-tighter">${deudaGlobal.toFixed(2)}</span></div><div className="border-t border-rose-200 pt-4 flex justify-between items-center"><span className="text-xs font-bold text-rose-700">Clientes Deudores</span><span className="text-lg font-black text-rose-900">{deudores.length}</span></div></div></div></div>)}</div>);
};
