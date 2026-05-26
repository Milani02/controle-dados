import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, CalendarDays, Users, Package, Sun, Moon, Menu, X } from 'lucide-react';

import logoBiodinamica from '../assets/logo-biodinamica.png';
import logoBiodinamicaVerde from '../assets/logo biodinamica verde.png'; 

import AbaAgenda from '../components/AbaAgenda';
import AbaInfluenciadores from '../components/AbaInfluenciadores';
import AbaMateriais from '../components/AbaMateriais';

export default function Dashboard() {
  const [abaAtiva, setAbaAtiva] = useState('agenda');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark' || (!theme && prefersDark) || !theme) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menus = [
    { id: 'agenda', nome: 'Grade de Programação', icone: CalendarDays },
    { id: 'influenciadores', nome: 'Formadores de Opinião', icone: Users },
    { id: 'materiais', nome: 'Controle de Materiais', icone: Package },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#050505] text-gray-800 dark:text-gray-300 font-sans transition-colors duration-300 overflow-hidden">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-emerald-500/10 flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 border-b border-gray-200 dark:border-emerald-500/10 flex flex-col items-center justify-center transition-colors duration-300">
          <div className="relative w-32 h-16 mb-4">
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
            <img src={isDarkMode ? logoBiodinamica : logoBiodinamicaVerde} alt="Logo Biodinâmica" className="relative w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-300" />
          </div>
          <h1 className="text-sm font-black text-gray-900 dark:text-white tracking-[0.3em] uppercase transition-colors duration-300">Controle <span className="text-emerald-600 dark:text-emerald-500">Master</span></h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menus.map((menu) => {
            const Icon = menu.icone;
            const ativo = abaAtiva === menu.id;
            
            return (
              <button key={menu.id} onClick={() => { setAbaAtiva(menu.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${ativo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'}`}>
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${ativo ? 'text-emerald-600 dark:text-emerald-500' : 'text-gray-500 dark:text-gray-600'}`} />
                <span className="text-sm font-bold tracking-tight">{menu.nome}</span>
                {ativo && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />}
              </button>
            );
          })}
        </nav>

        <div className="p-6 space-y-3 border-t border-gray-200 dark:border-emerald-500/10 transition-colors duration-300">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-all text-sm font-bold text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest">
              {isDarkMode ? <Moon className="w-4 h-4 text-emerald-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
            </span>
            <div className="w-8 h-4 bg-gray-300 dark:bg-black rounded-full relative shadow-inner">
              <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${isDarkMode ? 'bg-emerald-500 right-0.5' : 'bg-white left-0.5 shadow-sm'}`} />
            </div>
          </button>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/10 rounded-xl transition-all text-xs font-black uppercase tracking-tighter">
            <LogOut className="w-4 h-4" /> Encerrar Sessão
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/10 z-30">
          <div className="h-8">
            <img src={isDarkMode ? logoBiodinamica : logoBiodinamicaVerde} alt="Logo" className="h-full object-contain" />
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-900 dark:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-gray-50 dark:bg-transparent transition-colors duration-300">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none hidden md:block" />
          
          {/* REMOVIDO: O z-10 relativo que prendia o modal */}
          <div className="h-full w-full">
            {abaAtiva === 'agenda' && <AbaAgenda />}
            {abaAtiva === 'influenciadores' && <AbaInfluenciadores />}
            {abaAtiva === 'materiais' && <AbaMateriais />}
          </div>
        </main>
      </div>
    </div>
  );
}