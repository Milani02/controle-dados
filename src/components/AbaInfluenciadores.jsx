import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Search, Plus, ExternalLink, X, Trash2, AlertTriangle, Pencil, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AbaInfluenciadores() {
  const [influenciadores, setInfluenciadores] = useState([]);
  const [busca, setBusca] = useState('');
  const [anoAtivo, setAnoAtivo] = useState('2026'); 
  const [filtroStatus, setFiltroStatus] = useState('Todos'); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, idToDelete: null });

  const [novoPerfil, setNovoPerfil] = useState({
    nome: '', cidade: '', seguidores: '', produto: '', especialidade: '', redes_sociais: '', indicacao: ''
  });

  useEffect(() => { fetchInfluenciadores(); }, []);

  const fetchInfluenciadores = async () => {
    const { data } = await supabase.from('influenciadores').select('*').order('nome', { ascending: true });
    if (data) setInfluenciadores(data);
  };

  const abrirEdicao = (item) => {
    setIsEditing(true); setIdEmEdicao(item.id);
    setNovoPerfil({ nome: item.nome, cidade: item.cidade, seguidores: item.seguidores, produto: item.produto, especialidade: item.especialidade, redes_sociais: item.redes_sociais || '', indicacao: item.indicacao || '' });
    setIsModalOpen(true);
  };

  const atualizarStatus = async (id, novoStatus) => {
    const { error } = await supabase.from('influenciadores').update({ status: novoStatus }).eq('id', id);
    if (!error) {
      const itemAtual = influenciadores.find(i => i.id === id);
      const anoDoItem = itemAtual?.ano || '2026';
      setInfluenciadores(influenciadores.map(i => i.id === id ? { ...i, status: novoStatus } : i));

      if (novoStatus === 'Aprovado' && anoDoItem === '2026') {
        const { data: jaExiste } = await supabase.from('programacao_ciosp').select('id').eq('professor', itemAtual.nome).gte('data', '2027-01-01').lte('data', '2027-12-31');
        if (!jaExiste || jaExiste.length === 0) {
          const { data: userData } = await supabase.auth.getUser();
          await supabase.from('programacao_ciosp').insert([{ professor: itemAtual.nome, tema: itemAtual.especialidade || 'DEFINIR TEMA', status: 'Pendente', data: '2027-01-01', horario: '00:00:00', tipo_evento: 'Palestra', user_id: userData?.user?.id || null }]);
        }
      }
    }
  };

  const abrirModalExclusao = (id) => {
    setModalConfirmacao({ isOpen: true, idToDelete: id });
  };

  const confirmarExclusao = async () => {
    const id = modalConfirmacao.idToDelete;
    try {
      const { error } = await supabase.from('influenciadores').delete().eq('id', id);
      if (error) throw error;
      setInfluenciadores(influenciadores.filter(i => i.id !== id));
      setModalConfirmacao({ isOpen: false, idToDelete: null });
    } catch (error) {
      alert("Erro ao excluir: " + error.message);
      setModalConfirmacao({ isOpen: false, idToDelete: null });
    }
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault(); setLoadingForm(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert("Sessão expirada."); setLoadingForm(false); return; }

      if (isEditing) {
        const { error } = await supabase.from('influenciadores').update(novoPerfil).eq('id', idEmEdicao);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('influenciadores').insert([{ ...novoPerfil, ano: anoAtivo, user_id: user.id }]);
        if (error) throw error;
      }
      fetchInfluenciadores(); setIsModalOpen(false); setIsEditing(false); setIdEmEdicao(null);
      setNovoPerfil({ nome: '', cidade: '', seguidores: '', produto: '', especialidade: '', redes_sociais: '', indicacao: '' });
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    } finally { setLoadingForm(false); }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Aprovado': return 'bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50';
      case 'Não autorizado': return 'bg-red-200 dark:bg-red-500/20 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/50';
      default: return 'bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/50';
    }
  };

  const getRowColor = (status) => {
    switch(status) {
      case 'Aprovado': return 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/60';
      case 'Não autorizado': return 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800/50 hover:bg-red-200 dark:hover:bg-red-900/60';
      default: return 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800/50 hover:bg-yellow-200 dark:hover:bg-yellow-900/60'; 
    }
  };

  const filtrados = influenciadores.filter(i => {
    return i.nome.toLowerCase().includes(busca.toLowerCase()) && 
           (i.ano === anoAtivo || (!i.ano && anoAtivo === '2026')) && 
           (filtroStatus === 'Todos' || (i.status || 'Pendente') === filtroStatus);
  });

  return (
    <div className="p-4 md:p-10 min-h-screen text-gray-600 dark:text-gray-300 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 border-b border-gray-200 dark:border-emerald-500/10 pb-6">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white italic tracking-tighter uppercase">Formadores <span className="text-emerald-600 dark:text-emerald-500 font-light">Opinião {anoAtivo}</span></h2>
            <p className="text-emerald-600/60 dark:text-emerald-500/40 text-[10px] md:text-xs uppercase tracking-[0.3em] mt-1">Terminal de Parcerias</p>
          </div>
          <div className="flex flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex flex-1 md:flex-none items-center gap-2 bg-white dark:bg-[#0a0a0a] p-1.5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm overflow-x-auto scrollbar-hide">
              {['2025', '2026', '2027'].map(ano => (
                <button key={ano} onClick={() => {setAnoAtivo(ano); setBusca('');}} className={`px-3 md:px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex-1 text-center ${anoAtivo === ano ? 'bg-emerald-600 text-black shadow-md' : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>{ano}</button>
              ))}
            </div>
            <button onClick={() => { setIsEditing(false); setNovoPerfil({ nome: '', cidade: '', seguidores: '', produto: '', especialidade: '', redes_sociais: '', indicacao: '' }); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-black px-4 md:px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 font-black uppercase text-[10px] md:text-xs tracking-widest whitespace-nowrap"><Plus className="w-4 h-4 hidden sm:block" /> Cadastrar</button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white dark:bg-[#0a0a0a] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
          <div className="relative w-full md:flex-1 group">
            <Search className="absolute left-4 top-3 text-gray-400 dark:text-emerald-500/30 w-5 h-5" />
            <input type="text" placeholder="BUSCAR..." className="pl-12 w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 p-2.5 rounded-xl text-gray-900 dark:text-white outline-none font-mono text-xs uppercase" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl px-2 w-full md:w-auto">
            <Filter className="hidden sm:block text-gray-400 dark:text-emerald-500/50 w-5 h-5 ml-2" />
            <select className="w-full bg-transparent p-2.5 text-gray-900 dark:text-white outline-none font-mono text-xs uppercase cursor-pointer" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="Todos" className="bg-white dark:bg-[#111]">Todos os Status</option><option value="Pendente" className="bg-white dark:bg-[#111]">Pendente</option><option value="Aprovado" className="bg-white dark:bg-[#111]">Aprovado</option><option value="Não autorizado" className="bg-white dark:bg-[#111]">Não Autorizado</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-xl dark:shadow-2xl">
          <div className="overflow-x-auto w-full scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em] font-black">
                  <th className="p-4 md:p-5">Profissional</th><th className="p-4 md:p-5">Indicação</th><th className="p-4 md:p-5">Base / Cidade</th><th className="p-4 md:p-5">Métricas / Espec.</th><th className="p-4 md:p-5">Rede Neural</th><th className="p-4 md:p-5">Status</th><th className="p-4 md:p-5 text-right">Comandos</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono uppercase tracking-tighter">
                {filtrados.length > 0 ? filtrados.map((item) => (
                  <motion.tr key={item.id} className={`border-b transition-colors group ${getRowColor(item.status)}`}>
                    <td className="p-4 md:p-5 font-bold text-gray-900 dark:text-white">{item.nome}</td>
                    <td className="p-4 md:p-5 text-gray-700 dark:text-gray-300 text-xs">{item.indicacao || '-'}</td>
                    <td className="p-4 md:p-5 text-gray-700 dark:text-gray-300 text-xs">{item.cidade}</td>
                    <td className="p-4 md:p-5"><span className="block text-xs font-black text-gray-900 dark:text-white mb-1">{item.seguidores} FOLLOWERS</span><span className="text-[10px] text-gray-500 dark:text-gray-400">{item.produto} - {item.especialidade}</span></td>
                    <td className="p-4 md:p-5">{item.redes_sociais && <a href={item.redes_sociais.startsWith('http') ? item.redes_sociais : `https://${item.redes_sociais}`} target="_blank" rel="noreferrer" className="text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline flex items-center gap-2 text-xs font-bold"><ExternalLink className="w-3 h-3" /> CONECTAR</a>}</td>
                    <td className="p-4 md:p-5 whitespace-nowrap"><span className={`px-3 py-1 rounded-lg text-[9px] font-black border ${getStatusColor(item.status)}`}>{item.status || 'PENDENTE'}</span></td>
                    <td className="p-4 md:p-5 text-right flex justify-end items-center gap-2 whitespace-nowrap">
                      <button onClick={() => abrirEdicao(item)} className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 p-2"><Pencil className="w-4 h-4" /></button>
                      <select value={item.status || 'Pendente'} onChange={(e) => atualizarStatus(item.id, e.target.value)} className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-2 py-1.5 text-[10px] font-black text-gray-900 dark:text-white outline-none cursor-pointer">
                        <option value="Pendente" className="bg-white dark:bg-[#0a0a0a]">Pendente</option><option value="Aprovado" className="bg-white dark:bg-[#0a0a0a]">Aprovado</option><option value="Não autorizado" className="bg-white dark:bg-[#0a0a0a]">Não Autorizado</option>
                      </select>
                      <button onClick={() => abrirModalExclusao(item.id)} className="text-gray-600 dark:text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </motion.tr>
                )) : <tr><td colSpan="7" className="p-8 text-center text-gray-400 font-mono text-xs uppercase">Nenhum profissional.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-[999] p-0 md:p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white dark:bg-[#0a0a0a] w-full h-full md:h-auto md:max-h-[90vh] max-w-lg md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              
              <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 shrink-0 mt-4 md:mt-0">
                <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">{isEditing ? 'Atualizar Perfil' : 'Novo Perfil'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-6 h-6 md:w-5 md:h-5" /></button>
              </div>

              <form onSubmit={handleSalvarPerfil} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Profissional</label>
                      <input type="text" required className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoPerfil.nome} onChange={(e) => setNovoPerfil({...novoPerfil, nome: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Indicação</label>
                      <input type="text" className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoPerfil.indicacao} onChange={(e) => setNovoPerfil({...novoPerfil, indicacao: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Cidade</label>
                      <input type="text" className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoPerfil.cidade} onChange={(e) => setNovoPerfil({...novoPerfil, cidade: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Seguidores</label>
                      <input type="text" className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoPerfil.seguidores} onChange={(e) => setNovoPerfil({...novoPerfil, seguidores: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Especialidade</label>
                      <input type="text" className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoPerfil.especialidade} onChange={(e) => setNovoPerfil({...novoPerfil, especialidade: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Produto Alvo</label>
                      <input type="text" className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoPerfil.produto} onChange={(e) => setNovoPerfil({...novoPerfil, produto: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Link Social</label>
                      <input type="url" className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoPerfil.redes_sociais} onChange={(e) => setNovoPerfil({...novoPerfil, redes_sociais: e.target.value})} />
                    </div>
                  </div>
                </div>
                
                <div className="shrink-0 p-4 md:p-6 pb-8 md:pb-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#050505] flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-4 md:py-3 text-gray-500 bg-gray-200 dark:bg-white/5 rounded-xl font-black uppercase text-xs">Cancelar</button>
                  <button type="submit" disabled={loadingForm} className="w-full sm:w-auto px-6 py-4 md:py-3 bg-emerald-600 text-black rounded-xl font-black uppercase text-xs disabled:opacity-50">{loadingForm ? 'PROCESSANDO...' : 'SALVAR DADOS'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalConfirmacao.isOpen && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-red-500/20 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-200 dark:border-red-500/20"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">Confirmar Exclusão</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 font-mono uppercase">O perfil será expurgado permanentemente.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setModalConfirmacao({ isOpen: false, idToDelete: null })} className="flex-1 px-4 py-3 text-gray-600 bg-gray-200 dark:bg-white/5 rounded-xl font-black text-xs uppercase">Cancelar</button>
                <button onClick={confirmarExclusao} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 font-black text-xs uppercase">EXCLUIR</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}