import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { CheckCircle, XCircle, Search, X, Calendar, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AbaAgenda() {
  const [registros, setRegistros] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroData, setFiltroData] = useState('Todas');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, idToDelete: null });

  const [novoRegistro, setNovoRegistro] = useState({
    professor: '', tema: '', data: '', horario: '', tipo_evento: 'Palestra', observacoes: ''
  });

  useEffect(() => {
    fetchRegistros();
  }, []);

  const fetchRegistros = async () => {
    const { data, error } = await supabase
      .from('programacao_ciosp')
      .select('*')
      .order('data', { ascending: true })
      .order('horario', { ascending: true });
    
    if (!error && data) setRegistros(data);
  };

  const abrirEdicao = (registro) => {
    setIsEditing(true);
    setIdEmEdicao(registro.id);
    setNovoRegistro({
      professor: registro.professor,
      tema: registro.tema,
      data: registro.data,
      horario: registro.horario,
      tipo_evento: registro.tipo_evento,
      observacoes: registro.observacoes || ''
    });
    setIsModalOpen(true);
  };

  const atualizarStatus = async (id, novoStatus) => {
    const { error } = await supabase.from('programacao_ciosp').update({ status: novoStatus }).eq('id', id);
    if (!error) {
      setRegistros(registros.map(r => r.id === id ? { ...r, status: novoStatus } : r));
    } else {
      alert("Erro ao atualizar o status.");
    }
  };

  const abrirModalExclusao = (id) => {
    setModalConfirmacao({ isOpen: true, idToDelete: id });
  };

  const confirmarExclusao = async () => {
    const id = modalConfirmacao.idToDelete;
    const { error } = await supabase.from('programacao_ciosp').delete().eq('id', id);
    
    if (!error) {
      setRegistros(registros.filter(r => r.id !== id));
      setModalConfirmacao({ isOpen: false, idToDelete: null });
    } else {
      alert("Erro ao excluir: " + error.message);
    }
  };

  const handleSalvarRegistro = async (e) => {
    e.preventDefault();
    setLoadingForm(true);
    const { data: userData } = await supabase.auth.getUser();

    if (isEditing) {
      const { error } = await supabase
        .from('programacao_ciosp')
        .update(novoRegistro)
        .eq('id', idEmEdicao);

      if (error) {
        alert("Erro ao atualizar: " + error.message);
      } else {
        fetchRegistros();
        setIsModalOpen(false);
      }
    } else {
      const { data, error } = await supabase
        .from('programacao_ciosp')
        .insert([{ ...novoRegistro, user_id: userData.user.id }])
        .select();

      if (error) {
        alert("Erro ao salvar: " + error.message);
      } else if (data) {
        fetchRegistros(); 
        setIsModalOpen(false);
      }
    }
    
    if (loadingForm === false) {
      setIsEditing(false);
      setIdEmEdicao(null);
      setNovoRegistro({ professor: '', tema: '', data: '', horario: '', tipo_evento: 'Palestra', observacoes: '' });
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

  const formatarDataBr = (dataSql) => {
    if (!dataSql) return '';
    const [ano, mes, dia] = dataSql.split('-');
    return `${dia}/${mes}`;
  };

  const registrosFiltrados = registros.filter(r => {
    const matchBusca = r.professor.toLowerCase().includes(busca.toLowerCase()) || 
                       r.tema.toLowerCase().includes(busca.toLowerCase());
    const matchData = filtroData === 'Todas' || r.data === filtroData;
    return matchBusca && matchData;
  });

  const diasDisponiveis = [...new Set(registros.map(r => r.data))].sort();

  return (
    <div className="p-10 min-h-screen text-gray-300">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-end mb-10 border-b border-emerald-500/10 pb-8">
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">
              Grade <span className="text-emerald-500 font-light">CIOSP</span>
            </h2>
            <p className="text-emerald-500/40 text-xs uppercase tracking-[0.3em] mt-1">Terminal de Gerenciamento de Cronograma</p>
          </div>
          <button 
            onClick={() => { setIsEditing(false); setNovoRegistro({ professor: '', tema: '', data: '', horario: '', tipo_evento: 'Palestra', observacoes: '' }); setIsModalOpen(true); }} 
            className="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] font-black uppercase text-xs tracking-widest"
          >
            + Novo Agendamento
          </button>
        </div>

        <div className="flex gap-4 mb-8 bg-[#0a0a0a] p-4 rounded-2xl border border-white/5">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-3 text-emerald-500/30 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
            <input 
              type="text" 
              placeholder="FILTRAR POR PROFESSOR OU TEMA..." 
              className="pl-12 w-full bg-black/40 border border-white/5 p-2.5 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all font-mono text-xs uppercase"
              value={busca} 
              onChange={(e) => setBusca(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="text-emerald-500/50 w-5 h-5" />
            <select 
              className="p-2.5 bg-black/40 border border-white/5 rounded-xl text-white focus:border-emerald-500/50 outline-none min-w-[150px] font-mono text-xs uppercase cursor-pointer" 
              value={filtroData} 
              onChange={(e) => setFiltroData(e.target.value)}
            >
              <option value="Todas" className="bg-[#111]">Todos os Dias</option>
              {diasDisponiveis.map(dia => (
                <option key={dia} value={dia} className="bg-[#111]">{formatarDataBr(dia)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-[10px] text-emerald-500 uppercase tracking-[0.2em] font-black">
                  <th className="p-5 w-1/4">Professor</th>
                  <th className="p-5 w-1/3">Tema</th>
                  <th className="p-5">Data/Hora</th>
                  <th className="p-5">Tipo</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Comandos</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono uppercase tracking-tighter">
                {registrosFiltrados.length > 0 ? (
                  registrosFiltrados.map((registro) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      key={registro.id} 
                      className="bg-[#3c3c3c] border-b border-[#222] hover:bg-[#222] transition-colors group"
                    >
                      <td className="p-5 font-bold text-white">{registro.professor}</td>
                      <td className="p-5 text-white transition-colors text-xs">{registro.tema}</td>
                      <td className="p-5 text-white">
                        {formatarDataBr(registro.data)} <span className="text-white ml-1">{registro.horario.substring(0,5)}</span>
                      </td>
                      <td className="p-5">
                        <span className="px-3 py-1 bg-white/5 text-white rounded-lg text-[9px] font-black border border-white/10">
                          {registro.tipo_evento}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black border ${getStatusColor(registro.status)}`}>
                          {registro.status || 'PENDENTE'}
                        </span>
                      </td>
                      <td className="p-5 text-right flex justify-end gap-2">
                        <button onClick={() => abrirEdicao(registro)} className="text-gray-400 hover:text-white transition-colors p-2" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {registro.status !== 'Aprovado' && (
                          <button onClick={() => atualizarStatus(registro.id, 'Aprovado')} className="text-gray-400 hover:text-emerald-500 transition-colors p-2" title="Aprovar">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {registro.status !== 'Não autorizado' && (
                          <button onClick={() => atualizarStatus(registro.id, 'Não autorizado')} className="text-gray-400 hover:text-yellow-500 transition-colors p-2" title="Não Autorizar">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => abrirModalExclusao(registro.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-600 font-mono text-xs uppercase">Nenhum registro localizado no banco de dados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0a0a] border border-emerald-500/20 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">{isEditing ? 'Atualizar Registro' : 'Novo Registro'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSalvarRegistro} className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Professor / Profissional</label>
                  <input type="text" required placeholder="NOME DO PROFISSIONAL" className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase" value={novoRegistro.professor} onChange={(e) => setNovoRegistro({...novoRegistro, professor: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Tema da Sessão</label>
                  <input type="text" required placeholder="ASSUNTO ABORDADO" className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase" value={novoRegistro.tema} onChange={(e) => setNovoRegistro({...novoRegistro, tema: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Data</label>
                    <input type="date" required className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase" value={novoRegistro.data} onChange={(e) => setNovoRegistro({...novoRegistro, data: e.target.value})} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Horário</label>
                    <input type="time" required className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase" value={novoRegistro.horario} onChange={(e) => setNovoRegistro({...novoRegistro, horario: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Classificação</label>
                  <select required className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none transition font-mono text-xs uppercase cursor-pointer" value={novoRegistro.tipo_evento} onChange={(e) => setNovoRegistro({...novoRegistro, tipo_evento: e.target.value})}>
                    <option value="Palestra" className="bg-[#111]">Palestra</option>
                    <option value="Hands-On" className="bg-[#111]">Hands-On</option>
                    <option value="Demonstração" className="bg-[#111]">Demonstração</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3 justify-end border-t border-white/5 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition font-black uppercase text-xs tracking-widest">Voltar</button>
                  <button type="submit" disabled={loadingForm} className="px-6 py-3 bg-emerald-600 text-black rounded-xl hover:bg-emerald-500 transition font-black uppercase text-xs tracking-widest disabled:opacity-50">{loadingForm ? 'PROCESSANDO...' : (isEditing ? 'ATUALIZAR' : 'INSERIR DADOS')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Exclusão */}
      <AnimatePresence>
        {modalConfirmacao.isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0a0a0a] border border-red-500/20 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Confirmar Exclusão</h3>
              <p className="text-xs text-gray-500 mb-8 font-mono uppercase">O registro será excluído permanentemente do banco de dados.</p>
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