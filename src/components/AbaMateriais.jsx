import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { CheckSquare, Square, Plus, X, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AbaMateriais() {
  const [materiais, setMateriais] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, idToDelete: null });

  const [novoMaterial, setNovoMaterial] = useState({
    nome: '', categoria: 'Materiais para Hands-On', quantidade: 1
  });

  useEffect(() => { fetchMateriais(); }, []);

  const fetchMateriais = async () => {
    const { data } = await supabase.from('materiais').select('*').order('categoria', { ascending: true });
    if (data) setMateriais(data);
  };

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
    <div className="p-10 min-h-screen text-gray-300">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-end mb-10 border-b border-emerald-500/10 pb-8">
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">
              Inventário <span className="text-emerald-500 font-light">Estande</span>
            </h2>
            <p className="text-emerald-500/40 text-xs uppercase tracking-[0.3em] mt-1">Controle Logístico e Checklist</p>
          </div>
          <button 
            onClick={() => { setIsEditing(false); setNovoMaterial({ nome: '', categoria: 'Materiais para Hands-On', quantidade: 1 }); setIsModalOpen(true); }} 
            className="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2 font-black uppercase text-xs tracking-widest"
          >
            <Plus className="w-4 h-4" /> Registrar Material
          </button>
        </div>

        {materiais.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {materiais.map((item) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                key={item.id} 
                className={`bg-[#3c3c3c] p-5 rounded-2xl border ${item.status === 'Separado' ? 'border-emerald-500/30' : 'border-[#222]'} flex items-center justify-between transition-all hover:bg-[#222] hover:border-emerald-500/50 group`}
              >
                <div className="flex items-center gap-5">
                  <button onClick={() => toggleStatus(item.id, item.status)} className="transition-transform hover:scale-110">
                    {item.status === 'Separado' 
                      ? <CheckSquare className="w-7 h-7 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> 
                      : <Square className="w-7 h-7 text-gray-400 hover:text-white" />}
                  </button>
                  <div>
                    <h3 className={`font-mono text-sm uppercase tracking-tighter ${item.status === 'Separado' ? 'line-through text-gray-500' : 'text-white'}`}>
                      <span className="font-black text-white mr-3">{item.quantidade}x</span> {item.nome}
                    </h3>
                    <p className="text-[10px] text-white uppercase tracking-[0.2em] mt-1 font-bold">{item.categoria}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black border ${item.status === 'Separado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'}`}>
                    {item.status === 'Separado' ? 'COLETADO' : 'AGUARDANDO'}
                  </span>
                  <button onClick={() => abrirEdicao(item)} className="text-gray-400 hover:text-white transition-colors p-2" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => abrirModalExclusao(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0a0a0a] p-10 rounded-2xl border border-white/5 text-center text-gray-600 font-mono text-xs uppercase tracking-widest">Inventário vazio. Nenhum item registrado.</div>
        )}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0a0a] border border-emerald-500/20 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] w-full max-w-md overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">{isEditing ? 'Atualizar Inventário' : 'Registrar Item'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSalvarMaterial} className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Descrição do Item</label>
                  <input type="text" required placeholder="EX: TIRA DE COLMEIA" className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase" value={novoMaterial.nome} onChange={(e) => setNovoMaterial({...novoMaterial, nome: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">QTD</label>
                    <input type="number" min="1" required className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase" value={novoMaterial.quantidade} onChange={(e) => setNovoMaterial({...novoMaterial, quantidade: e.target.value})} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Destino / Setup</label>
                    <select required className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase cursor-pointer" value={novoMaterial.categoria} onChange={(e) => setNovoMaterial({...novoMaterial, categoria: e.target.value})}>
                      <option value="Materiais para Hands-On" className="bg-[#111]">Materiais para Hands-On</option>
                      <option value="Materiais Oraltech" className="bg-[#111]">Materiais Oraltech</option>
                      <option value="Vitrine" className="bg-[#111]">Vitrine</option>
                      <option value="Demonstração" className="bg-[#111]">Demonstração</option>
                      <option value="Materiais Auxiliares" className="bg-[#111]">Materiais Auxiliares</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-3 justify-end border-t border-white/5 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition font-black uppercase text-xs tracking-widest">Voltar</button>
                  <button type="submit" disabled={loadingForm} className="px-6 py-3 bg-emerald-600 text-black rounded-xl hover:bg-emerald-500 transition font-black uppercase text-xs tracking-widest disabled:opacity-50">{loadingForm ? 'PROCESSANDO...' : (isEditing ? 'ATUALIZAR' : 'REGISTRAR')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalConfirmacao.isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0a0a0a] border border-red-500/20 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Confirmar Exclusão</h3>
              <p className="text-xs text-gray-500 mb-8 font-mono uppercase">O item será excluído permanentemente do inventário.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setModalConfirmacao({ isOpen: false, idToDelete: null })} className="flex-1 px-4 py-3 text-gray-400 bg-white/5 hover:bg-white/10 rounded-xl transition font-black text-xs uppercase tracking-widest">Cancelar</button>
                <button onClick={confirmarExclusao} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 transition font-black text-xs uppercase tracking-widest">EXCLUIR</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}