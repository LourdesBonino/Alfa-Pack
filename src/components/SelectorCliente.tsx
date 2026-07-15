import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Cliente } from '../types/database';

interface Props {
    onSelect: (clienteId: string | null, clienteObj?: Cliente) =>void;
    label?: string;
    allowFreeText?: boolean;
    onFreeTextChange?: (text: string) =>void;
    freeTextValue?: string;
    initialClienteId?: string | null;
    initialClienteNombre?: string | null;
}

export const SelectorCliente = ({ 
    onSelect, 
    label = "Cliente / Remitente", 
    allowFreeText = false, 
    onFreeTextChange,
    freeTextValue = '',
    initialClienteId = null,
    initialClienteNombre = null
}: Props) =>{
    const [busqueda, setBusqueda] = useState(initialClienteNombre || freeTextValue);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(
        initialClienteId && initialClienteNombre 
            ? { id: initialClienteId, nombre_razon_social: initialClienteNombre } as Cliente 
            : null
    );
    const [cargando, setCargando] = useState(false);
    
    // Sincronizar busqueda con freeTextValue inicial
    useEffect(() =>{
        if (!selectedCliente && freeTextValue && !busqueda) {
            setBusqueda(freeTextValue);
        }
    }, [freeTextValue]);

    useEffect(() =>{
        const buscar = async () =>{
            if (busqueda.length< 2 || selectedCliente) {
                setClientes([]);
                return;
            }
            
            setCargando(true);
            const { data } = await supabase
                .from('clientes')
                .select('*')
                .ilike('nombre_razon_social', `%${busqueda}%`)
                .limit(5);

            if (data) setClientes(data);
            setCargando(false);
        };

        const timer = setTimeout(buscar, 300); // Debounce para optimizar llamadas
        return () =>clearTimeout(timer);
    }, [busqueda, selectedCliente]);

    const handleSelect = (cliente: Cliente) =>{
        setSelectedCliente(cliente);
        onSelect(cliente.id, cliente);
        if (onFreeTextChange) {
            onFreeTextChange(cliente.nombre_razon_social);
        }
        setBusqueda('');
        setClientes([]);
    };

    const handleClear = () =>{
        setSelectedCliente(null);
        onSelect(null);
        setBusqueda('');
        if (onFreeTextChange) {
            onFreeTextChange('');
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>{
        const val = e.target.value;
        setBusqueda(val);
        if (allowFreeText && onFreeTextChange) {
            onFreeTextChange(val);
        }
    };

    return (<div className="flex flex-col gap-2 relative"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">{label}</label>{selectedCliente ? (<div className="flex items-center justify-between p-3.5 bg-blue-50 border border-blue-200 rounded animate-fade-in-up"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded bg-blue-100 text-[#0038a8] flex items-center justify-center font-bold text-sm shrink-0">{selectedCliente.nombre_razon_social.substring(0, 2).toUpperCase()}</div><div className="min-w-0"><p className="text-sm font-bold text-slate-800 truncate">{selectedCliente.nombre_razon_social}</p><p className="text-xs text-slate-500 mt-0.5">{selectedCliente.localidad}</p></div></div><button
                        type="button"
                        onClick={handleClear}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                    ><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>) : (<div className="relative"><span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" /></svg></span><input 
                        type="text" 
                        value={busqueda}
                        placeholder={allowFreeText ? "Nombre del destinatario (buscar o escribir)..." : "Escribe el nombre del cliente..."}
                        className="brand-input pl-11 pr-10 py-3 rounded w-full text-sm font-semibold placeholder:text-slate-400"
                        onChange={handleSearchChange}
                    />{cargando && (<span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none"><svg className="animate-spin h-5 w-5 text-[#0046b0]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></span>)}</div>)}

            {/* LISTA DE RESULTADOS DE BÚSQUEDA */}
            {clientes.length >0 && !selectedCliente && (<ul className="absolute z-20 top-full left-0 w-full mt-1.5 bg-white shadow-xl rounded border border-slate-200 overflow-hidden divide-y divide-slate-100 animate-fade-in-up">{clientes.map(c =>(<li 
                            key={c.id} 
                            className="p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                            onClick={() =>handleSelect(c)}
                        ><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">{c.nombre_razon_social.substring(0, 2).toUpperCase()}</div><span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{c.nombre_razon_social}</span></div><span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md shrink-0">{c.localidad}</span></li>))}</ul>)}</div>);
};