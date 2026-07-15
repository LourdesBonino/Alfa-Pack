import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const FormularioCliente = () =>{
    const [nombre, setNombre] = useState('');
    const [localidad, setLocalidad] = useState('');
    const [dniCuit, setDniCuit] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    const [comision, setComision] = useState('');
    
    const [cargando, setCargando] = useState(false);
    const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' | 'advertencia' } | null>(null);

    const mostrarToast = (mensaje: string, tipo: 'exito' | 'error' | 'advertencia') =>{
        setToast({ mensaje, tipo });
        setTimeout(() =>setToast(null), 4000);
    };

    const guardarCliente = async (e: React.FormEvent) =>{
        e.preventDefault();

        if (!nombre.trim()) {
            mostrarToast("️ Por favor, ingresa el Nombre o Razón Social del cliente.", "advertencia");
            return;
        }

        if (!localidad.trim()) {
            mostrarToast("️ Por favor, ingresa la Localidad.", "advertencia");
            return;
        }

        setCargando(true);

        const { data, error } = await supabase
            .from('clientes')
            .insert([
                {
                    nombre_razon_social: nombre.trim(),
                    localidad: localidad.trim() || null,
                    dni_cuit: dniCuit.trim() || null,
                    telefono: telefono.trim() || null,
                    direccion: direccion.trim() || null,
                    comision_porcentaje: comision ? parseFloat(comision) : 0,
                    cuenta_corriente: false
                }
            ])
            .select()
            .single();

        if (error) {
            mostrarToast(" Error al guardar cliente: " + error.message, "error");
            setCargando(false);
            return;
        }

        mostrarToast(` ¡Cliente "${data.nombre_razon_social}" registrado con éxito!`, "exito");
        setNombre('');
        setLocalidad('');
        setDniCuit('');
        setTelefono('');
        setDireccion('');
        setComision('');
        setCargando(false);
    };

    return (<div className="w-full max-w-xl mx-auto py-6 px-4 relative">{/* NOTIFICACIONES TOAST FLOTANTES */}
            {toast && (<div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-md animate-fade-in-up ${
                    toast.tipo === 'exito' ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-200' :
                    toast.tipo === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-200' :
                    'bg-amber-950/90 border-amber-500/30 text-amber-200'
                }`}><div className="shrink-0">{toast.tipo === 'exito' && (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>)}
                        {toast.tipo === 'error' && (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-rose-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>)}
                        {toast.tipo === 'advertencia' && (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-400"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>)}</div><span className="text-sm font-semibold tracking-wide">{toast.mensaje}</span></div>)}<div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md"><form onSubmit={guardarCliente} className="flex flex-col gap-6"><div><span className="text-[10px] font-bold brand-primary-text uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">Base de Datos</span><h2 className="text-xl md:text-2xl font-black text-slate-800 mt-2 tracking-tight">Registrar Nuevo Cliente</h2><p className="text-xs text-slate-500 mt-1">Ingresa los datos del comercio o remitente particular para darlo de alta en el sistema.</p></div>{/* Nombre / Razón Social */}<div className="flex flex-col gap-2"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Nombre / Razón Social</label><input
                            type="text"
                            placeholder="Ej. Distribuidora Sur, Juan Pérez"
                            className="brand-input px-4 py-3 rounded text-sm font-semibold w-full"
                            value={nombre}
                            onChange={(e) =>setNombre(e.target.value)}
                        /></div>{/* Localidad */}<div className="flex flex-col gap-2"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Localidad</label><input
                            type="text"
                            placeholder="Ej. General Deheza, CBA"
                            className="brand-input px-4 py-3 rounded text-sm font-semibold w-full"
                            value={localidad}
                            onChange={(e) =>setLocalidad(e.target.value)}
                        /></div>{/* DNI / CUIT */}<div className="flex flex-col gap-2"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">DNI / CUIT-CUIL</label><input
                            type="text"
                            placeholder="Ej. 20-12345678-9"
                            className="brand-input px-4 py-3 rounded text-sm font-semibold w-full"
                            value={dniCuit}
                            onChange={(e) =>setDniCuit(e.target.value)}
                        /></div>{/* Teléfono */}<div className="flex flex-col gap-2"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Teléfono de Contacto</label><input
                            type="tel"
                            placeholder="Ej. 11 1234-5678"
                            className="brand-input px-4 py-3 rounded text-sm font-semibold w-full"
                            value={telefono}
                            onChange={(e) =>setTelefono(e.target.value)}
                        /></div>{/* Dirección */}<div className="flex flex-col gap-2"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Dirección Exacta</label><input
                            type="text"
                            placeholder="Ej. Av. Mitre 1234, Piso 2"
                            className="brand-input px-4 py-3 rounded text-sm font-semibold w-full"
                            value={direccion}
                            onChange={(e) =>setDireccion(e.target.value)}
                        /></div>{/* Comisión */}<div className="flex flex-col gap-2"><label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Comisión (Monto o %)</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$ / %</span><input
                                type="number"
                                placeholder="0.00"
                                className="brand-input pl-14 pr-4 py-3 rounded text-sm font-semibold w-full"
                                value={comision}
                                onChange={(e) =>setComision(e.target.value)}
                                min="0"
                                step="0.01"
                            /></div></div>{/* Botón de Enviar (ROJO CORPORATIVO) */}<button
                        type="submit"
                        disabled={cargando}
                        className={`mt-2 py-4.5 rounded font-bold text-sm tracking-wide shadow-md transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 brand-accent-bg cursor-pointer ${
                            cargando ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >{cargando ? (<><svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span>REGISTRANDO CLIENTE...</span></>) : (<><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg><span>GUARDAR CLIENTE</span></>)}</button></form></div></div>);
};
