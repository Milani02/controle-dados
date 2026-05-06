import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, CalendarDays, Users, Package } from 'lucide-react';

// Vamos importar os componentes (vamos criá-los no próximo passo)
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
    <div className="flex h-screen bg-gray-50">
      
      {/* Menu Lateral (Sidebar) */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-blue-600 tracking-tight">CIOSP 2026</h1>
          <p className="text-xs text-gray-500 mt-1">Gestão de Eventos</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menus.map((menu) => {
            const Icon = menu.icone;
            const ativo = abaAtiva === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => setAbaAtiva(menu.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm
                  ${ativo ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Icon className={`w-5 h-5 ${ativo ? 'text-blue-600' : 'text-gray-400'}`} />
                {menu.nome}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto">
        {abaAtiva === 'agenda' && <AbaAgenda />}
        {abaAtiva === 'influenciadores' && <AbaInfluenciadores />}
        {abaAtiva === 'materiais' && <AbaMateriais />}
      </main>

    </div>
  );
}