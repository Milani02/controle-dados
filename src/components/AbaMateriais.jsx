import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { CheckSquare, Square, Plus, X, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AbaMateriais() {
  const [materiais, setMateriais] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  
  // Estados para Edição
  const [isEditing, setIsEditing] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  
  // Controle do Modal Customizado de Exclusão
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, idToDelete: null });

  const [novoMaterial, setNovoMaterial] = useState({
    nome: '', categoria: 'Materiais para Hands-On', quantidade: 1
  });

  useEffect(() => { fetchMateriais(); }, []);

  const fetchMateriais = async () => {
    const { data } = await supabase.from('materiais').select('*').order('categoria', { ascending: true });
    if (data) setMateriais(data);
  };

  // Função para abrir modo edição
  const abrirEdicao = (item) => {
    setIsEditing(true);
    setIdEmEdicao(item.id);
    setNovoMaterial({
      nome: item.nome,
      categoria: item.categoria,
      quantidade: item.quantidade
    });
    setIsModalOpen(true);
  };

  const toggleStatus = async (id, statusAtual) => {
    const novoStatus = statusAtual === 'Separado' ? 'Pendente' : 'Separado';
    await supabase.from('materiais').update({ status: novoStatus }).eq('id', id);
    setMateriais(materiais.map(m => m.id === id ? { ...m, status: novoStatus } : m));
  };

  const abrirModalExclusao = (id) => {
    setModalConfirmacao({ isOpen: true, idToDelete: id });
  };

  const confirmarExclusao = async () => {
    const id = modalConfirmacao.idToDelete;
    const { error } = await supabase.from('materiais').delete().eq('id', id);
    
    if (!error) {
      setMateriais(materiais.filter(m => m.id !== id));
      setModalConfirmacao({ isOpen: false, idToDelete: null });
    } else {
      alert("Erro ao excluir: " + error.message);
    }
  };

  const handleSalvarMaterial = async (e) => {
    e.preventDefault();
    setLoadingForm(true);
    const { data: userData } = await supabase.auth.getUser();

    if (isEditing) {
      // Lógica de Atualização
      const { error } = await supabase
        .from('materiais')
        .update(novoMaterial)
        .eq('id', idEmEdicao);

      if (error) {
        alert("Erro ao atualizar: " + error.message);
      } else {
        fetchMateriais();
        setIsModalOpen(false);
      }
    } else {
      // Lógica de Inserção original
      const { error } = await supabase.from('materiais').insert([{ ...novoMaterial, user_id: userData.user.id }]);

      if (error) {
        alert("Erro ao salvar: " + error.message);
      } else {
        fetchMateriais();
        setIsModalOpen(false);
      }
    }

    if (loadingForm === false) {
      setIsEditing(false);
      setIdEmEdicao(null);
      setNovoMaterial({ nome: '', categoria: 'Materiais para Hands-On', quantidade: 1 });
      setLoadingForm(false);
    }
  };

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Checklist de Materiais</h2>
          <p className="text-gray-500 mt-1">Controle de insumos e produtos para os estandes</p>
        </div>
        <button onClick={() => { setIsEditing(false); setNovoMaterial({ nome: '', categoria: 'Materiais para Hands-On', quantidade: 1 }); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-sm transition">
          <Plus className="w-4 h-4" /> Adicionar Material
        </button>
      </div>

      {materiais.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {materiais.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between transition hover:shadow-md">
              <div className="flex items-center gap-4">
                <button onClick={() => toggleStatus(item.id, item.status)} className="text-gray-400 hover:text-blue-600 transition">
                  {item.status === 'Separado' ? <CheckSquare className="w-6 h-6 text-green-500" /> : <Square className="w-6 h-6" />}
                </button>
                <div>
                  <h3 className={`font-semibold ${item.status === 'Separado' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    <span className="font-bold text-blue-600 mr-2">{item.quantidade}x</span> {item.nome}
                  </h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{item.categoria}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${item.status === 'Separado' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                  {item.status}
                </span>
                <button onClick={() => abrirEdicao(item)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition" title="Editar">
                  <Pencil className="w-5 h-5" />
                </button>
                <button onClick={() => abrirModalExclusao(item.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition" title="Excluir">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">Nenhum material cadastrado na checklist.</div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Material' : 'Novo Material'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSalvarMaterial} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
                  <input type="text" required placeholder="Ex: Tira de colmeia diamantada" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoMaterial.nome} onChange={(e) => setNovoMaterial({...novoMaterial, nome: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                    <input type="number" min="1" required className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoMaterial.quantidade} onChange={(e) => setNovoMaterial({...novoMaterial, quantidade: e.target.value})} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (Destino)</label>
                    <select required className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoMaterial.categoria} onChange={(e) => setNovoMaterial({...novoMaterial, categoria: e.target.value})}>
                      <option value="Materiais para Hands-On">Materiais para Hands-On</option>
                      <option value="Materiais Oraltech">Materiais Oraltech</option>
                      <option value="Vitrine">Vitrine</option>
                      <option value="Demonstração">Demonstração</option>
                      <option value="Materiais Auxiliares">Materiais Auxiliares</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition font-medium">Cancelar</button>
                  <button type="submit" disabled={loadingForm} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium disabled:opacity-50">{loadingForm ? 'Salvando...' : (isEditing ? 'Atualizar Item' : 'Adicionar à Lista')}</button>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Material?</h3>
              <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita. O item será removido permanentemente da checklist.</p>
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