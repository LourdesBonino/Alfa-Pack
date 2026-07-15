import React, { useState } from 'react';

interface LoginProps {
    onLogin: () =>void;
}

export const Login: React.FC<LoginProps>= ({ onLogin }) =>{
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) =>{
        e.preventDefault();
        // Contraseña segura solicitada por el usuario
        if (pin === 'AlfaPack.2026$Admin') {
            onLogin();
        } else {
            setError('Contraseña incorrecta');
        }
    };

    return (<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">{/* Background ambient light */}<div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none"><div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px]"></div><div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-rose-600/5 blur-[120px]"></div></div><div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200 p-8 sm:p-10 animate-fade-in-up text-center relative z-10">{/* Logo */}<div className="flex justify-center mb-10"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 55" className="h-16 w-auto drop-shadow-sm">{/* Anillo de fondo (azul) */}<circle cx="35" cy="27" r="18" fill="none" stroke="#1a4f9c" strokeWidth="3" />{/* Speed lines (rojas) - imitando guiones */}<g fill="#d11222"><rect x="0" y="16" width="6" height="4" rx="2" /><rect x="8" y="16" width="6" height="4" rx="2" /><rect x="-4" y="25" width="16" height="4" rx="2" /><rect x="14" y="25" width="6" height="4" rx="2" /><rect x="2" y="34" width="6" height="4" rx="2" /><rect x="10" y="34" width="6" height="4" rx="2" /></g>{/* Letra A (Azul y Roja) */}<path d="M 35 12 L 23 41 L 30 41 L 32 35" fill="#1a4f9c" /><path d="M 35 12 L 47 41 L 40 41 L 38 35" fill="#d11222" /><path d="M 28 32 L 42 32 Z" stroke="#d11222" strokeWidth="4" />{/* Caja Logística 3D */}<g transform="translate(28, 17)"><path d="M 0 6 L 9 0 L 18 6 L 18 17 L 9 23 L 0 17 Z" fill="#ffffff" stroke="#d11222" strokeWidth="1.5" strokeLinejoin="round" /><path d="M 0 6 L 9 12 L 18 6" fill="none" stroke="#d11222" strokeWidth="1.5" strokeLinejoin="round" /><path d="M 9 12 L 9 23" fill="none" stroke="#d11222" strokeWidth="1.5" strokeLinejoin="round" /><path d="M 3 11 L 6 13 M 15 11 L 12 13" stroke="#1a4f9c" strokeWidth="1.5" strokeLinecap="round" /></g>{/* Texto Alfa Pack */}<g transform="translate(68, 40)" fontFamily="'Outfit', 'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="32" fontStyle="italic"><text x="0" y="0" fill="#1a4f9c">Alfa</text><text x="66" y="0" fill="#d11222">Pack</text></g></svg></div><div className="mb-10 text-left"><h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Acceso al Sistema</h2><p className="text-slate-500 font-medium text-sm">Ingresa tu contraseña de administrador para continuar.</p></div><form onSubmit={handleSubmit} className="space-y-6 text-left"><div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Contraseña</label><div className="relative"><input 
                                type="password" 
                                className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-2xl text-lg font-bold tracking-widest text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-400 shadow-inner"
                                placeholder="••••••••••••"
                                value={pin}
                                onChange={(e) =>{
                                    setPin(e.target.value);
                                    setError('');
                                }}
                                autoFocus
                            />{/* Icono de candado */}<div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg></div></div>{error && (<p className="text-rose-500 font-bold text-sm mt-2 ml-1 flex items-center gap-1 animate-fade-in"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>{error}</p>)}</div><button 
                        type="submit" 
                        className="w-full bg-[#1a4f9c] hover:bg-[#153e7a] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 text-lg flex items-center justify-center gap-2 group active:scale-[0.98]"
                    ><span>Ingresar</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></button></form><div className="mt-10 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">&copy; {new Date().getFullYear()} Alfa Pack</div></div></div>);
};
