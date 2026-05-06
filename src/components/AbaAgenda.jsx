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
  
  // Estados para Edição
  const [isEditing, setIsEditing] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  
  // Controle do Modal Customizado de Exclusão
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

  // Função para abrir o modo edição
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
      // Lógica de Atualização
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
      // Lógica de Inserção original
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
    
    // Reset de estados
    if (loadingForm === false) {
      setIsEditing(false);
      setIdEmEdicao(null);
      setNovoRegistro({ professor: '', tema: '', data: '', horario: '', tipo_evento: 'Palestra', observacoes: '' });
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
    <div className="p-8 relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Grade de Programação</h2>
            <p className="text-gray-500 mt-1">Gestão de Palestras e Hands-On</p>
          </div>
          <button onClick={() => { setIsEditing(false); setNovoRegistro({ professor: '', tema: '', data: '', horario: '', tipo_evento: 'Palestra', observacoes: '' }); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm font-medium">
            + Agendar Professor
          </button>
        </div>

        <div className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Buscar por professor ou tema..." className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-400 w-5 h-5" />
            <select className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none bg-white min-w-[150px]" value={filtroData} onChange={(e) => setFiltroData(e.target.value)}>
              <option value="Todas">Todos os Dias</option>
              {diasDisponiveis.map(dia => (
                <option key={dia} value={dia}>{formatarDataBr(dia)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase tracking-wider">
                  <th className="p-4 font-semibold w-1/4">Professor</th>
                  <th className="p-4 font-semibold w-1/3">Tema</th>
                  <th className="p-4 font-semibold">Data/Hora</th>
                  <th className="p-4 font-semibold">Tipo</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.length > 0 ? (
                  registrosFiltrados.map((registro) => (
                    <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={registro.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-800">{registro.professor}</td>
                      <td className="p-4 text-gray-600 text-sm">{registro.tema}</td>
                      <td className="p-4 text-gray-600 font-medium">
                        {formatarDataBr(registro.data)} <span className="text-gray-400 ml-1">{registro.horario.substring(0,5)}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold border border-gray-200`}>
                          {registro.tipo_evento}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(registro.status)}`}>
                          {registro.status || 'Pendente'}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button onClick={() => abrirEdicao(registro)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition" title="Editar">
                          <Pencil className="w-5 h-5" />
                        </button>
                        {registro.status !== 'Aprovado' && (
                          <button onClick={() => atualizarStatus(registro.id, 'Aprovado')} className="text-green-600 hover:bg-green-50 p-2 rounded-full transition" title="Aprovar">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        {registro.status !== 'Não autorizado' && (
                          <button onClick={() => atualizarStatus(registro.id, 'Não autorizado')} className="text-red-600 hover:bg-red-50 p-2 rounded-full transition" title="Não Autorizar">
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button onClick={() => abrirModalExclusao(registro.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition" title="Excluir">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">Nenhum agendamento encontrado para este filtro.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Apresentação' : 'Agendar Apresentação'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSalvarRegistro} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Professor / Profissional</label>
                  <input type="text" required placeholder="Ex: Leandro Luka" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoRegistro.professor} onChange={(e) => setNovoRegistro({...novoRegistro, professor: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tema da Palestra / Hands-On</label>
                  <input type="text" required placeholder="Ex: Técnica indireta simplificada para lentes..." className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoRegistro.tema} onChange={(e) => setNovoRegistro({...novoRegistro, tema: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input type="date" required className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoRegistro.data} onChange={(e) => setNovoRegistro({...novoRegistro, data: e.target.value})} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                    <input type="time" required className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoRegistro.horario} onChange={(e) => setNovoRegistro({...novoRegistro, horario: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
                  <select required className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={novoRegistro.tipo_evento} onChange={(e) => setNovoRegistro({...novoRegistro, tipo_evento: e.target.value})}>
                    <option value="Palestra">Palestra</option>
                    <option value="Hands-On">Hands-On</option>
                    <option value="Demonstração">Demonstração</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition font-medium">Cancelar</button>
                  <button type="submit" disabled={loadingForm} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium disabled:opacity-50">{loadingForm ? 'Salvando...' : (isEditing ? 'Atualizar Grade' : 'Salvar na Grade')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Exclusão Original mantido */}
      <AnimatePresence>
        {modalConfirmacao.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-2xl shadow-2xl w-full max-sm overflow-hidden p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Registro?</h3>
              <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita. O agendamento será apagado permanentemente do sistema.</p>
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