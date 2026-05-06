import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Search, Plus, ExternalLink, X, CheckCircle, XCircle, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AbaInfluenciadores() {
  const [influenciadores, setInfluenciadores] = useState([]);
  const [busca, setBusca] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  
  // Estados para Edição
  const [isEditing, setIsEditing] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  
  // Controle do Modal Customizado de Exclusão
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, idToDelete: null });

  const [novoPerfil, setNovoPerfil] = useState({
    nome: '', cidade: '', seguidores: '', produto: '', especialidade: '', redes_sociais: ''
  });

  useEffect(() => { fetchInfluenciadores(); }, []);

  const fetchInfluenciadores = async () => {
    const { data } = await supabase.from('influenciadores').select('*').order('nome', { ascending: true });
    if (data) setInfluenciadores(data);
  };

  // Função para abrir modo edição
  const abrirEdicao = (item) => {
    setIsEditing(true);
    setIdEmEdicao(item.id);
    setNovoPerfil({
      nome: item.nome,
      cidade: item.cidade,
      seguidores: item.seguidores,
      produto: item.produto,
      especialidade: item.especialidade,
      redes_sociais: item.redes_sociais || ''
    });
    setIsModalOpen(true);
  };

  const atualizarStatus = async (id, novoStatus) => {
    const { error } = await supabase.from('influenciadores').update({ status: novoStatus }).eq('id', id);
    if (!error) {
      setInfluenciadores(influenciadores.map(i => i.id === id ? { ...i, status: novoStatus } : i));
    } else {
      alert("Erro ao atualizar o status.");
    }
  };

  const abrirModalExclusao = (id) => {
    setModalConfirmacao({ isOpen: true, idToDelete: id });
  };

  const confirmarExclusao = async () => {
    const id = modalConfirmacao.idToDelete;
    const { error } = await supabase.from('influenciadores').delete().eq('id', id);
    
    if (!error) {
      setInfluenciadores(influenciadores.filter(i => i.id !== id));
      setModalConfirmacao({ isOpen: false, idToDelete: null });
    } else {
      alert("Erro ao excluir: " + error.message);
    }
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    setLoadingForm(true);
    const { data: userData } = await supabase.auth.getUser();

    if (isEditing) {
      // Lógica de Atualização
      const { error } = await supabase
        .from('influenciadores')
        .update(novoPerfil)
        .eq('id', idEmEdicao);

      if (error) {
        alert("Erro ao atualizar: " + error.message);
      } else {
        fetchInfluenciadores();
        setIsModalOpen(false);
      }
    } else {
      // Lógica de Inserção original
      const { error } = await supabase
        .from('influenciadores')
        .insert([{ ...novoPerfil, user_id: userData.user.id }]);

      if (error) {
        alert("Erro ao salvar: " + error.message);
      } else {
        fetchInfluenciadores();
        setIsModalOpen(false);
      }
    }

    if (loadingForm === false) {
      setIsEditing(false);
      setIdEmEdicao(null);
      setNovoPerfil({ nome: '', cidade: '', seguidores: '', produto: '', especialidade: '', redes_sociais: '' });
      setLoadingForm(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Aprovado': return 'bg-green-100 text-green-800 border-green-200';
      case 'Não autorizado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const filtrados = influenciadores.filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Formadores de Opinião</h2>
          <p className="text-gray-500 mt-1">Gestão de indicações e aprovação de parceiros</p>
        </div>
        <button onClick={() => { setIsEditing(false); setNovoPerfil({ nome: '', cidade: '', seguidores: '', produto: '', especialidade: '', redes_sociais: '' }); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-sm transition">
          <Plus className="w-4 h-4" /> Adicionar Perfil
        </button>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Buscar por profissional..." className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase tracking-wider">
                <th className="p-4 font-semibold">Profissional</th>
                <th className="p-4 font-semibold">Cidade</th>
                <th className="p-4 font-semibold">Métricas / Espec.</th>
                <th className="p-4 font-semibold">Redes Sociais</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length > 0 ? filtrados.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{item.nome}</td>
                  <td className="p-4 text-gray-600">{item.cidade}</td>
                  <td className="p-4 text-gray-600">
                    <span className="block text-xs font-bold text-blue-600">{item.seguidores} seguidores</span>
                    <span className="text-sm">{item.produto} - {item.especialidade}</span>
                  </td>
                  <td className="p-4">
                    {item.redes_sociais && (
                      <a href={item.redes_sociais.startsWith('http') ? item.redes_sociais : `https://${item.redes_sociais}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 text-sm font-medium">
                        Ver Perfil <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                      {item.status || 'Pendente'}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => abrirEdicao(item)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition" title="Editar">
                      <Pencil className="w-5 h-5" />
                    </button>
                    {item.status !== 'Aprovado' && (
                      <button onClick={() => atualizarStatus(item.id, 'Aprovado')} className="text-green-600 hover:bg-green-50 p-2 rounded-full transition" title="Aprovar">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {item.status !== 'Não autorizado' && (
                      <button onClick={() => atualizarStatus(item.id, 'Não autorizado')} className="text-red-600 hover:bg-red-50 p-2 rounded-full transition" title="Não Autorizar">
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => abrirModalExclusao(item.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition" title="Excluir">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Nenhum profissional encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Formador de Opinião' : 'Novo Formador de Opinião'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSalvarPerfil} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
                    <input type="text" required placeholder="Ex: Gustavo Ribas" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoPerfil.nome} onChange={(e) => setNovoPerfil({...novoPerfil, nome: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    <input type="text" placeholder="Ex: Curitiba - PR" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoPerfil.cidade} onChange={(e) => setNovoPerfil({...novoPerfil, cidade: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seguidores</label>
                    <input type="text" placeholder="Ex: 19k" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoPerfil.seguidores} onChange={(e) => setNovoPerfil({...novoPerfil, seguidores: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
                    <input type="text" placeholder="Ex: Posteriores" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoPerfil.especialidade} onChange={(e) => setNovoPerfil({...novoPerfil, especialidade: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Produto Divulgado</label>
                    <input type="text" placeholder="Ex: Biomimética / Ribbond" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoPerfil.produto} onChange={(e) => setNovoPerfil({...novoPerfil, produto: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link da Rede Social</label>
                    <input type="url" placeholder="Ex: https://instagram.com/gusribas" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoPerfil.redes_sociais} onChange={(e) => setNovoPerfil({...novoPerfil, redes_sociais: e.target.value})} />
                  </div>
                </div>
                <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition font-medium">Cancelar</button>
                  <button type="submit" disabled={loadingForm} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium disabled:opacity-50">{loadingForm ? 'Salvando...' : (isEditing ? 'Atualizar Perfil' : 'Salvar Perfil')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalConfirmacao.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-2xl shadow-2xl w-full max-sm overflow-hidden p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Perfil?</h3>
              <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita. O profissional será removido permanentemente do sistema.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setModalConfirmacao({ isOpen: false, idToDelete: null })} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium">Cancelar</button>
                <button onClick={confirmarExclusao} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">Sim, excluir</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}