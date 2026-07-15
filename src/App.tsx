import { useState } from 'react'
import { FormularioPedido } from './components/FormularioPedido'
import { FormularioCliente } from './components/FormularioCliente'
import { MiPanel } from './components/MiPanel'
import { GestionClientes } from './components/GestionClientes'
import { ReporteCliente } from './components/ReporteCliente'
import { EstadoDeCuentas } from './components/EstadoDeCuentas'
import { Login } from './components/Login'

function App() {
  const [activeTab, setActiveTab] = useState('panel')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [reporteClienteId, setReporteClienteId] = useState<string | undefined>()
  const [reporteClienteNombre, setReporteClienteNombre] = useState<string | undefined>()
  const [reporteTab, setReporteTab] = useState<'resumen' | 'cobranza' | undefined>()

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  const handleNavClick = (tab: string) => {
      setActiveTab(tab);
      if (tab !== 'reporte-cliente') {
          setReporteClienteId(undefined);
          setReporteClienteNombre(undefined);
          setReporteTab(undefined);
      }
      setIsMobileMenuOpen(false);
  };

  const handleNavigateToCobranza = (clienteId: string, clienteNombre: string) => {
      setReporteClienteId(clienteId);
      setReporteClienteNombre(clienteNombre);
      setReporteTab('cobranza');
      setActiveTab('reporte-cliente');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white print:block print:min-h-0 print:h-auto">
      {/* HEADER FORMAL */}
      <header className="brand-header-bg h-16 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-50 print:hidden shadow-sm">
        {/* Lado Izquierdo: Botón de Menú Móvil / Volver */}
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 md:hidden text-slate-500 hover:text-brand-primary-text hover:bg-slate-50 rounded transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                title="Menú"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>
            <button 
                onClick={() => setActiveTab('panel')}
                className="hidden md:flex p-2 text-slate-500 hover:text-brand-primary-text hover:bg-slate-50 rounded transition-colors focus:outline-none items-center justify-center cursor-pointer"
                title="Volver al Panel Principal"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
            </button>
        </div>

        {/* Lado Derecho: Logo de Alfa Pack */}
        <div className="flex items-center gap-2 md:gap-4 select-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 55" className="h-10 md:h-12 w-auto">
            {/* Anillo de fondo (azul) */}
            <circle cx="35" cy="27" r="18" fill="none" stroke="#1a4f9c" strokeWidth="3" />
            
            {/* Speed lines (rojas) - imitando guiones */}
            <g fill="#d11222">
              <rect x="0" y="16" width="6" height="4" rx="2" />
              <rect x="8" y="16" width="6" height="4" rx="2" />
              <rect x="-4" y="25" width="16" height="4" rx="2" />
              <rect x="14" y="25" width="6" height="4" rx="2" />
              <rect x="2" y="34" width="6" height="4" rx="2" />
              <rect x="10" y="34" width="6" height="4" rx="2" />
            </g>

            {/* Letra A (Azul y Roja) */}
            <path d="M 35 12 L 23 41 L 30 41 L 32 35" fill="#1a4f9c" />
            <path d="M 35 12 L 47 41 L 40 41 L 38 35" fill="#d11222" />
            <path d="M 28 32 L 42 32 Z" stroke="#d11222" strokeWidth="4" />

            {/* Caja Logística 3D */}
            <g transform="translate(28, 17)">
              <path d="M 0 6 L 9 0 L 18 6 L 18 17 L 9 23 L 0 17 Z" fill="#ffffff" stroke="#d11222" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 0 6 L 9 12 L 18 6" fill="none" stroke="#d11222" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 9 12 L 9 23" fill="none" stroke="#d11222" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 3 11 L 6 13 M 15 11 L 12 13" stroke="#1a4f9c" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Texto Alfa Pack */}
            <g transform="translate(68, 40)" fontFamily="'Outfit', 'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="32" fontStyle="italic">
              <text x="0" y="0" fill="#1a4f9c">Alfa</text>
              <text x="66" y="0" fill="#d11222">Pack</text>
            </g>
          </svg>
          
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-[10px] md:text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider ml-1 md:ml-2"
          >
            Salir
          </button>
        </div>
      </header>

      {/* CUERPO PRINCIPAL CON SIDEBAR Y CONTENIDO */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden print:block print:overflow-visible print:h-auto">
        
        {/* Overlay fondo oscuro para móvil */}
        {isMobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
            />
        )}

        {/* BARRA LATERAL GRIS */}
        <aside className={`
            fixed md:static inset-y-0 left-0 z-40 w-[80%] max-w-[300px] md:w-64 brand-sidebar-bg flex flex-col p-6 gap-3 border-r border-slate-200 shrink-0 md:min-h-[calc(100vh-64px)] print:hidden transition-transform duration-300 ease-in-out bg-white md:bg-transparent shadow-2xl md:shadow-none
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          
          {/* Mobile Header for Sidebar */}
          <div className="md:hidden flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
              <span className="font-bold text-slate-800 text-sm uppercase tracking-widest">Menú Principal</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
          </div>

          <button
            onClick={() => handleNavClick('panel')}
            className={`w-full text-left py-3 md:py-2.5 px-4 rounded-xl md:rounded font-semibold text-sm tracking-wide transition-colors cursor-pointer flex items-center gap-3 ${
              activeTab === 'panel' 
                ? 'brand-primary-bg text-white shadow-md shadow-blue-900/10' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="opacity-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            </span>
            <span>Mi Panel</span>
          </button>

          <button
            onClick={() => handleNavClick('cliente')}
            className={`w-full text-left py-3 md:py-2.5 px-4 rounded-xl md:rounded font-semibold text-sm tracking-wide transition-colors cursor-pointer flex items-center gap-3 ${
              activeTab === 'cliente' 
                ? 'brand-primary-bg text-white shadow-md shadow-blue-900/10' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="opacity-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
            </span>
            <span>Registrar Cliente</span>
          </button>

          <button
            onClick={() => handleNavClick('recorrido')}
            className={`w-full text-left py-3 md:py-2.5 px-4 rounded-xl md:rounded font-semibold text-sm tracking-wide transition-colors cursor-pointer flex items-center gap-3 ${
              activeTab === 'recorrido' 
                ? 'brand-primary-bg text-white shadow-md shadow-blue-900/10' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="opacity-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.25v10.5A2.25 2.25 0 0118 21H6a2.25 2.25 0 01-2.25-2.25V8.25m16.5 0l-7.5-3.75a3 3 0 00-3 0l-7.5 3.75m16.5 0L12 12m-7.5-3.75L12 12m0 0v9" /></svg>
            </span>
            <span>Registrar Recorrido</span>
          </button>

          <button
            onClick={() => handleNavClick('gestion-clientes')}
            className={`w-full text-left py-3 md:py-2.5 px-4 rounded-xl md:rounded font-semibold text-sm tracking-wide transition-colors cursor-pointer flex items-center gap-3 mt-4 border-t border-slate-200 pt-4 ${
              activeTab === 'gestion-clientes' 
                ? 'brand-primary-bg text-white shadow-md shadow-blue-900/10' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="opacity-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.952-3.138zM8.625 10.5a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM15 10.5a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" /></svg>
            </span>
            <span>Gestión de Clientes</span>
          </button>

          <button
            onClick={() => handleNavClick('reporte-cliente')}
            className={`w-full text-left py-3 md:py-2.5 px-4 rounded-xl md:rounded font-semibold text-sm tracking-wide transition-colors cursor-pointer flex items-center gap-3 ${
              activeTab === 'reporte-cliente' 
                ? 'brand-primary-bg text-white shadow-md shadow-blue-900/10' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="opacity-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </span>
            <span>Reporte por Cliente</span>
          </button>

          <button
            onClick={() => handleNavClick('estado-cuentas')}
            className={`w-full text-left py-3 md:py-2.5 px-4 rounded-xl md:rounded font-semibold text-sm tracking-wide transition-colors cursor-pointer flex items-center gap-3 ${
              activeTab === 'estado-cuentas' 
                ? 'brand-primary-bg text-white shadow-md shadow-blue-900/10' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="opacity-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
            </span>
            <span>Estado de Cuentas</span>
          </button>
        </aside>

        {/* CONTENEDOR DE CONTENIDO PRINCIPAL */}
        <main className="flex-1 bg-white relative p-4 md:p-10 z-0 min-h-[400px] h-[calc(100vh-64px)] overflow-y-auto flex flex-col print:p-0 print:min-h-0 print:overflow-visible print:block print:h-auto">
          
          {/* RENDERIZADO CONDICIONAL DE PESTAÑAS */}
          <div className="relative z-10 max-w-7xl mx-auto w-full flex-1 print:block print:h-auto">
            {activeTab === 'panel' && <MiPanel onNavigate={setActiveTab} />}
            {activeTab === 'cliente' && <FormularioCliente />}
            {activeTab === 'recorrido' && <FormularioPedido />}
            {activeTab === 'gestion-clientes' && <GestionClientes />}
            {activeTab === 'reporte-cliente' && <ReporteCliente initialClienteId={reporteClienteId} initialClienteNombre={reporteClienteNombre} initialTab={reporteTab} />}
            {activeTab === 'estado-cuentas' && <EstadoDeCuentas onCobrar={handleNavigateToCobranza} />}
          </div>

          {/* FOOTER IDENTIFICADOR */}
          <div className="mt-8 pt-4 pb-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium print:hidden">
            © {new Date().getFullYear()} Sistema de Gestión Alfa Pack • Desarrollado por LB
          </div>
        </main>
      </div>
    </div>
  )
}

export default App

