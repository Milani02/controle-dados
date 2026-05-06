import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Search, Plus, ExternalLink, X, CheckCircle, XCircle, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AbaInfluenciadores() {
  const [influenciadores, setInfluenciadores] = useState([]);
  const [busca, setBusca] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, idToDelete: null });

  const [novoPerfil, setNovoPerfil] = useState({
    nome: '', cidade: '', seguidores: '', produto: '', especialidade: '', redes_sociais: ''
  });

  useEffect(() => { fetchInfluenciadores(); }, []);

  const fetchInfluenciadores = async () => {
    const { data } = await supabase.from('influenciadores').select('*').order('nome', { ascending: true });
    if (data) setInfluenciadores(data);
  };

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
      case 'Aprovado': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Não autorizado': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    }
  };

  const filtrados = influenciadores.filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="p-10 min-h-screen text-gray-300">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-end mb-10 border-b border-emerald-500/10 pb-8">
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">
              Formadores <span className="text-emerald-500 font-light">de Opinião</span>
            </h2>
            <p className="text-emerald-500/40 text-xs uppercase tracking-[0.3em] mt-1">Terminal de Parcerias e Indicações</p>
          </div>
          <button 
            onClick={() => { setIsEditing(false); setNovoPerfil({ nome: '', cidade: '', seguidores: '', produto: '', especialidade: '', redes_sociais: '' }); setIsModalOpen(true); }} 
            className="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2 font-black uppercase text-xs tracking-widest"
          >
            <Plus className="w-4 h-4" /> Adicionar Perfil
          </button>
        </div>

        <div className="mb-8 bg-[#0a0a0a] p-4 rounded-2xl border border-white/5">
          <div className="relative group">
            <Search className="absolute left-4 top-3 text-emerald-500/30 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              type="text" 
              placeholder="BUSCAR PROFISSIONAL..." 
              className="pl-12 w-full bg-black/40 border border-white/5 p-2.5 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all font-mono text-xs uppercase"
              value={busca} 
              onChange={(e) => setBusca(e.target.value)} 
            />
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-[10px] text-emerald-500 uppercase tracking-[0.2em] font-black">
                  <th className="p-5">Profissional</th>
                  <th className="p-5">Base / Cidade</th>
                  <th className="p-5">Métricas / Espec.</th>
                  <th className="p-5">Rede Neural</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Comandos</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono uppercase tracking-tighter">
                {filtrados.length > 0 ? filtrados.map((item) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    key={item.id} 
                    className="bg-[#3c3c3c] border-b border-[#222] hover:bg-[#222] transition-colors group"
                  >
                    <td className="p-5 font-bold text-white">{item.nome}</td>
                    <td className="p-5 text-white transition-colors text-xs">{item.cidade}</td>
                    <td className="p-5 text-white">
                      <span className="block text-xs font-black text-white mb-1">{item.seguidores} FOLLOWERS</span>
                      <span className="text-[10px] text-white">{item.produto} - {item.especialidade}</span>
                    </td>
                    <td className="p-5">
                      {item.redes_sociais && (
                        <a href={item.redes_sociais.startsWith('http') ? item.redes_sociais : `https://${item.redes_sociais}`} target="_blank" rel="noreferrer" className="text-white hover:text-emerald-400 hover:underline flex items-center gap-2 text-xs font-bold transition-colors">
                          <ExternalLink className="w-3 h-3" /> CONECTAR
                        </a>
                      )}
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black border ${getStatusColor(item.status)}`}>
                        {item.status || 'PENDENTE'}
                      </span>
                    </td>
                    <td className="p-5 text-right flex justify-end gap-2">
                      <button onClick={() => abrirEdicao(item)} className="text-gray-400 hover:text-white transition-colors p-2" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {item.status !== 'Aprovado' && (
                        <button onClick={() => atualizarStatus(item.id, 'Aprovado')} className="text-gray-400 hover:text-emerald-500 transition-colors p-2" title="Aprovar">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {item.status !== 'Não autorizado' && (
                        <button onClick={() => atualizarStatus(item.id, 'Não autorizado')} className="text-gray-400 hover:text-yellow-500 transition-colors p-2" title="Não Autorizar">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => abrirModalExclusao(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                )) : (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-600 font-mono text-xs uppercase">Nenhum profissional localizado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0a0a] border border-emerald-500/20 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] w-full max-w-xl overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">{isEditing ? 'Atualizar Perfil' : 'Novo Perfil'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSalvarPerfil} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Profissional</label>
                    <input type="text" required placeholder="EX: GUSTAVO RIBAS" className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase" value={novoPerfil.nome} onChange={(e) => setNovoPerfil({...novoPerfil, nome: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Base / Cidade</label>
                    <input type="text" placeholder="EX: CURITIBA - PR" className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase" value={novoPerfil.cidade} onChange={(e) => setNovoPerfil({...novoPerfil, cidade: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Seguidores</label>
                    <input type="text" placeholder="EX: 19K" className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase" value={novoPerfil.seguidores} onChange={(e) => setNovoPerfil({...novoPerfil, seguidores: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Especialidade</label>
                    <input type="text" placeholder="EX: POSTERIORES" className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase" value={novoPerfil.especialidade} onChange={(e) => setNovoPerfil({...novoPerfil, especialidade: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Produto Alvo</label>
                    <input type="text" placeholder="EX: BIOMIMÉTICA" className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase" value={novoPerfil.produto} onChange={(e) => setNovoPerfil({...novoPerfil, produto: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Link de Conexão (Social)</label>
                    <input type="url" placeholder="HTTPS://INSTAGRAM.COM/..." className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase" value={novoPerfil.redes_sociais} onChange={(e) => setNovoPerfil({...novoPerfil, redes_sociais: e.target.value})} />
                  </div>
                </div>
                <div className="pt-4 flex gap-3 justify-end border-t border-white/5 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition font-black uppercase text-xs tracking-widest">Voltar</button>
                  <button type="submit" disabled={loadingForm} className="px-6 py-3 bg-emerald-600 text-black rounded-xl hover:bg-emerald-500 transition font-black uppercase text-xs tracking-widest disabled:opacity-50">{loadingForm ? 'PROCESSANDO...' : (isEditing ? 'ATUALIZAR' : 'INSERIR PERFIL')}</button>
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
              <p className="text-xs text-gray-500 mb-8 font-mono uppercase">O perfil será excluído permanentemente do sistema.</p>
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