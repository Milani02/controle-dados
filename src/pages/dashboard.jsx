import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, CalendarDays, Users, Package, LayoutDashboard } from 'lucide-react';
import logoBiodinamica from '../assets/logo-biodinamica.png';

import AbaAgenda from '../components/AbaAgenda';
import AbaInfluenciadores from '../components/AbaInfluenciadores';
import AbaMateriais from '../components/AbaMateriais';

export default function Dashboard() {
  const [abaAtiva, setAbaAtiva] = useState('agenda');
  const navigate = useNavigate();

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
    <div className="flex h-screen bg-[#050505] text-gray-300 font-sans">
      
      {/* Sidebar Tecnológica */}
      <aside className="w-72 bg-[#0a0a0a] border-r border-emerald-500/10 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
        <div className="p-8 mb-4">
          <img src={logoBiodinamica} alt="Logo" className="w-40 h-auto mb-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
          <div className="flex items-center gap-2 mt-4 px-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/70 font-bold">Sistema Online</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <p className="px-4 text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-4">Navegação</p>
          {menus.map((menu) => {
            const Icon = menu.icone;
            const ativo = abaAtiva === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => setAbaAtiva(menu.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 group
                  ${ativo 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'hover:bg-white/5 text-gray-500 hover:text-gray-300'}`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${ativo ? 'text-emerald-500' : 'text-gray-600'}`} />
                <span className="text-sm font-bold tracking-tight">{menu.nome}</span>
                {ativo && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />}
              </button>
            );
          })}
        </nav>

        <div className="p-6">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 rounded-xl transition-all text-xs font-black uppercase tracking-tighter"
          >
            <LogOut className="w-4 h-4" />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Área de Conteúdo com Scroll Customizado */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Background decorativo sutil */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 h-full">
            {abaAtiva === 'agenda' && <AbaAgenda />}
            {abaAtiva === 'influenciadores' && <AbaInfluenciadores />}
            {abaAtiva === 'materiais' && <AbaMateriais />}
        </div>
      </main>

    </div>
  );
}