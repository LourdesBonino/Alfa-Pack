import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Cliente } from '../types/database';

export const GestionClientes = () =>{
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' | 'advertencia' } | null>(null);

    // Modal state
    const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
    const [clienteEliminando, setClienteEliminando] = useState<Cliente | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfirmacionVisible, setModalConfirmacionVisible] = useState(false);

    // Form state for editing
    const [nombre, setNombre] = useState('');
    const [localidad, setLocalidad] = useState('');
    const [dniCuit, setDniCuit] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    const [comision, setComision] = useState('');

    const [busqueda, setBusqueda] = useState('');

    const clientesFiltrados = clientes.filter(cliente =>cliente.nombre_razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
        (cliente.localidad && cliente.localidad.toLowerCase().includes(busqueda.toLowerCase()))
    );

    const fetchClientes = async () =>{
        setCargando(true);
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nombre_razon_social', { ascending: true });

        if (error) {
            mostrarToast(" Error al cargar clientes: " + error.message, "error");
        } else {
            setClientes(data || []);
        }
        setCargando(false);
    };

    useEffect(() =>{
        fetchClientes();
    }, []);

    const mostrarToast = (mensaje: string, tipo: 'exito' | 'error' | 'advertencia') =>{
        setToast({ mensaje, tipo });
        setTimeout(() =>setToast(null), 4000);
    };

    const abrirModalEdicion = (cliente: Cliente) =>{
        setClienteEditando(cliente);
        setNombre(cliente.nombre_razon_social);
        setLocalidad(cliente.localidad || '');
        setDniCuit(cliente.dni_cuit || '');
        setTelefono(cliente.telefono || '');
        setDireccion(cliente.direccion || '');
        setComision(cliente.comision_porcentaje ? cliente.comision_porcentaje.toString() : '');
        setModalVisible(true);
    };

    const cerrarModalEdicion = () =>{
        setModalVisible(false);
        setClienteEditando(null);
    };

    const guardarEdicion = async (e: React.FormEvent) =>{
        e.preventDefault();
        if (!clienteEditando) return;

        if (!nombre.trim()) {
            mostrarToast("️ El nombre es obligatorio.", "advertencia");
            return;
        }

        const { error } = await supabase
            .from('clientes')
            .update({
                nombre_razon_social: nombre.trim(),
                localidad: localidad.trim() || null,
                dni_cuit: dniCuit.trim() || null,
                telefono: telefono.trim() || null,
                direccion: direccion.trim() || null,
                comision_porcentaje: comision ? parseFloat(comision) : 0,
                cuenta_corriente: false
            })
            .eq('id', clienteEditando.id);

        if (error) {
            mostrarToast(" Error al actualizar cliente: " + error.message, "error");
        } else {
            mostrarToast(` ¡Cliente actualizado con éxito!`, "exito");
            cerrarModalEdicion();
            fetchClientes();
        }
    };

    const abrirModalEliminar = (cliente: Cliente) =>{
        setClienteEliminando(cliente);
        setModalConfirmacionVisible(true);
    };

    const confirmarEliminacion = async () =>{
        if (!clienteEliminando) return;

        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', clienteEliminando.id);

        if (error) {
            // Verificar si el error es por restricción de clave foránea
            if (error.code === '23503') {
                mostrarToast(" No se puede eliminar el cliente porque tiene viajes (pedidos) registrados en su historial.", "error");
            } else {
                mostrarToast(" Error al eliminar cliente: " + error.message, "error");
            }
        } else {
            mostrarToast(` Cliente eliminado con éxito.`, "exito");
            fetchClientes();
        }
        setModalConfirmacionVisible(false);
        setClienteEliminando(null);
    };

    return (<div className="w-full relative animate-fade-in print:hidden">{/* NOTIFICACIONES TOAST FLOTANTES */}
            {toast && (<div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-md animate-fade-in-up ${
                    toast.tipo === 'exito' ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-200' :
                    toast.tipo === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-200' :
                    'bg-amber-950/90 border-amber-500/30 text-amber-200'
                }`}><span className="text-sm font-semibold tracking-wide">{toast.mensaje}</span></div>)}<div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md"><div className="flex justify-between items-center mb-6"><div><span className="text-[10px] font-bold brand-primary-text uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">Administración</span><h2 className="text-xl md:text-2xl font-black text-slate-800 mt-2 tracking-tight">Gestión de Clientes</h2></div><button onClick={fetchClientes} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors" title="Actualizar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg></button></div><div className="mb-6 relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div><input 
                        type="text" 
                        placeholder="Buscar por nombre o localidad..." 
                        value={busqueda}
                        onChange={(e) =>setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-semibold text-slate-700"
                    /></div>{cargando ? (<div className="py-12 flex justify-center text-slate-400"><svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></div>) : clientes.length === 0 ? (<div className="py-12 text-center text-slate-500 font-semibold border-2 border-dashed border-slate-200 rounded-2xl">No hay clientes registrados en la base de datos.</div>) : clientesFiltrados.length === 0 ? (<div className="py-12 text-center text-slate-500 font-semibold border-2 border-dashed border-slate-200 rounded-2xl">No se encontraron clientes que coincidan con la búsqueda.</div>) : (<div className="overflow-x-auto border border-slate-200 rounded-xl"><table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-slate-50 border-b border-slate-200 text-slate-600"><tr><th className="py-3 px-4 font-bold">Razón Social</th><th className="py-3 px-4 font-bold">Localidad</th><th className="py-3 px-4 font-bold">Teléfono</th><th className="py-3 px-4 font-bold text-center">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{clientesFiltrados.map(cliente =>(<tr key={cliente.id} className="hover:bg-slate-50 transition-colors"><td className="py-3 px-4 font-semibold text-slate-800">{cliente.nombre_razon_social}</td><td className="py-3 px-4 text-slate-600">{cliente.localidad || '-'}</td><td className="py-3 px-4 text-slate-600">{cliente.telefono || '-'}</td><td className="py-3 px-4 flex justify-center gap-2"><button 
                                                onClick={() =>abrirModalEdicion(cliente)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Editar Cliente"
                                            ><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg></button><button 
                                                onClick={() =>abrirModalEliminar(cliente)}
                                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                title="Eliminar Cliente"
                                            ><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg></button></td></tr>))}</tbody></table></div>)}</div>{/* MODAL DE EDICIÓN */}
            {modalVisible && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"><div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative"><button onClick={cerrarModalEdicion} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button><h3 className="text-xl font-black text-slate-800 mb-6">️ Editar Cliente</h3><form onSubmit={guardarEdicion} className="flex flex-col gap-4"><div className="flex flex-col gap-1.5"><label className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Nombre / Razón Social</label><input type="text" className="brand-input px-3 py-2 rounded text-sm font-semibold w-full" value={nombre} onChange={(e) =>setNombre(e.target.value)} /></div><div className="grid grid-cols-2 gap-4"><div className="flex flex-col gap-1.5"><label className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Localidad</label><input type="text" className="brand-input px-3 py-2 rounded text-sm font-semibold w-full" value={localidad} onChange={(e) =>setLocalidad(e.target.value)} /></div><div className="flex flex-col gap-1.5"><label className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Teléfono</label><input type="text" className="brand-input px-3 py-2 rounded text-sm font-semibold w-full" value={telefono} onChange={(e) =>setTelefono(e.target.value)} /></div></div><div className="flex flex-col gap-1.5"><label className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Dirección</label><input type="text" className="brand-input px-3 py-2 rounded text-sm font-semibold w-full" value={direccion} onChange={(e) =>setDireccion(e.target.value)} /></div><div className="grid grid-cols-2 gap-4"><div className="flex flex-col gap-1.5"><label className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">DNI / CUIT</label><input type="text" className="brand-input px-3 py-2 rounded text-sm font-semibold w-full" value={dniCuit} onChange={(e) =>setDniCuit(e.target.value)} /></div><div className="flex flex-col gap-1.5"><label className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Comisión ($ / %)</label><input type="number" step="0.01" min="0" className="brand-input px-3 py-2 rounded text-sm font-semibold w-full" value={comision} onChange={(e) =>setComision(e.target.value)} /></div></div><button type="submit" className="mt-4 brand-primary-bg text-white py-3 rounded font-bold text-sm hover:opacity-90 transition-opacity">GUARDAR CAMBIOS</button></form></div></div>)}

            {/* MODAL CONFIRMAR ELIMINAR */}
            {modalConfirmacionVisible && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"><div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl"><div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div><h3 className="text-xl font-black text-slate-800 mb-2">¿Eliminar Cliente?</h3><p className="text-sm text-slate-600 mb-6">Estás a punto de eliminar a<strong>{clienteEliminando?.nombre_razon_social}</strong>. Esta acción no se puede deshacer. (No se podrá eliminar si tiene viajes registrados).</p><div className="flex gap-3"><button onClick={() =>setModalConfirmacionVisible(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">Cancelar</button><button onClick={confirmarEliminacion} className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors shadow-md shadow-rose-200">Eliminar</button></div></div></div>)}</div>);
};
