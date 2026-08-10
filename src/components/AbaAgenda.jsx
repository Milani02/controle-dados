import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Search, X, Calendar, Trash2, AlertTriangle, Pencil, Tag, Plus, Download, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AbaAgenda() {
  const [registros, setRegistros] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroData, setFiltroData] = useState('Todas');
  const [filtroTema, setFiltroTema] = useState('Todos');
  const [abaAtiva, setAbaAtiva] = useState('Todas'); 
  const [anoAtivo, setAnoAtivo] = useState('2027'); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, idToDelete: null });

  const [novoRegistro, setNovoRegistro] = useState({
    professor: '', tema: '', data: '', horario: '', tipo_evento: 'Palestra', observacoes: '', descricao: '', contatado: false
  });

  useEffect(() => { fetchRegistros(); }, []);

  const fetchRegistros = async () => {
    const { data, error } = await supabase.from('programacao_ciosp').select('*').order('data', { ascending: true }).order('horario', { ascending: true });
    if (!error && data) setRegistros(data);
  };

  const abrirEdicao = (registro) => {
    setIsEditing(true); setIdEmEdicao(registro.id);
    setNovoRegistro({ 
      professor: registro.professor, 
      tema: registro.tema, 
      data: registro.data, 
      horario: registro.horario, 
      tipo_evento: registro.tipo_evento, 
      observacoes: registro.observacoes || '',
      descricao: registro.descricao || '',
      contatado: registro.contatado || false
    });
    setIsModalOpen(true);
  };

  // Status que representam uma resposta definitiva do professor (aprovado/reprovado)
  const STATUS_COM_RESPOSTA = ['Aprovado', 'Não autorizado', 'Sim', 'Não'];

  // Lógica principal de atualização e duplicação automática para 2027
  const atualizarStatus = async (id, novoStatus) => {
    const registroAtual = registros.find(r => r.id === id);
    if (!registroAtual) return;

    // Se o status já é uma resposta definitiva, o contato fica travado como feito
    const respostaRecebida = STATUS_COM_RESPOSTA.includes(novoStatus);
    const payload = respostaRecebida ? { status: novoStatus, contatado: true } : { status: novoStatus };

    // Atualiza o status no banco de dados para o registro atual
    const { error } = await supabase.from('programacao_ciosp').update(payload).eq('id', id);

    if (!error) {
      // Atualiza a tela imediatamente
      setRegistros(prevRegistros => prevRegistros.map(r => r.id === id ? { ...r, ...payload } : r));

      // SE FOR "SIM" E FOR DE 2026: CRIA A CÓPIA PARA 2027
      if (novoStatus === 'Sim' && registroAtual.data && registroAtual.data.startsWith('2026')) {
        const novaData2027 = registroAtual.data.replace('2026', '2027');
        
        // Trava de Segurança: Verifica se já não foi duplicado antes para evitar repetições
        const jaFoiDuplicado = registros.some(r => 
          r.professor === registroAtual.professor && 
          r.tema === registroAtual.tema && 
          r.data === novaData2027
        );

        if (!jaFoiDuplicado) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const novoRegistroPara2027 = {
              professor: registroAtual.professor,
              tema: registroAtual.tema,
              data: novaData2027, // Mesma data, mas em 2027
              horario: registroAtual.horario,
              tipo_evento: registroAtual.tipo_evento,
              observacoes: registroAtual.observacoes,
              descricao: registroAtual.descricao,
              status: 'Pendente', // Inicia como pendente no futuro
              user_id: user.id
            };

            const { error: insertError } = await supabase.from('programacao_ciosp').insert([novoRegistroPara2027]);
            if (!insertError) {
              fetchRegistros(); // Puxa novamente do banco para que o registro de 2027 apareça no app
            }
          }
        }
      }
    } else {
      alert("Erro ao atualizar status: " + error.message);
    }
  };

  const atualizarContato = async (id, novoValor) => {
    const registroAtual = registros.find(r => r.id === id);
    // Trava: se já houve resposta (aprovado/reprovado), o contato fica fixo como feito
    if (registroAtual && STATUS_COM_RESPOSTA.includes(registroAtual.status)) return;

    const { error } = await supabase.from('programacao_ciosp').update({ contatado: novoValor }).eq('id', id);
    if (!error) {
      setRegistros(prevRegistros => prevRegistros.map(r => r.id === id ? { ...r, contatado: novoValor } : r));
    } else {
      alert("Erro ao atualizar contato: " + error.message);
    }
  };

  const abrirModalExclusao = (id) => {
    setModalConfirmacao({ isOpen: true, idToDelete: id });
  };

  const confirmarExclusao = async () => {
    const id = modalConfirmacao.idToDelete;
    try {
      const { error } = await supabase.from('programacao_ciosp').delete().eq('id', id);
      if (error) throw error;
      setRegistros(registros.filter(r => r.id !== id));
      setModalConfirmacao({ isOpen: false, idToDelete: null });
    } catch (error) {
      alert("Erro ao excluir: " + error.message);
      setModalConfirmacao({ isOpen: false, idToDelete: null });
    }
  };

  const handleSalvarRegistro = async (e) => {
    e.preventDefault(); setLoadingForm(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert("Sessão expirada."); setLoadingForm(false); return; }

      if (isEditing) {
        const { error } = await supabase.from('programacao_ciosp').update(novoRegistro).eq('id', idEmEdicao);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('programacao_ciosp').insert([{ ...novoRegistro, user_id: user.id }]);
        if (error) throw error;
      }
      fetchRegistros(); setIsModalOpen(false); setIsEditing(false); setIdEmEdicao(null);
      setNovoRegistro({ professor: '', tema: '', data: '', horario: '', tipo_evento: 'Palestra', observacoes: '', descricao: '', contatado: false });
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    } finally { setLoadingForm(false); }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Aprovado':
      case 'Sim': return 'bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50';
      case 'Não autorizado':
      case 'Não': return 'bg-red-200 dark:bg-red-500/20 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/50';
      default: return 'bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/50';
    }
  };

  const getRowColor = (status) => {
    switch(status) {
      case 'Aprovado':
      case 'Sim': return 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/60';
      case 'Não autorizado':
      case 'Não': return 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800/50 hover:bg-red-200 dark:hover:bg-red-900/60';
      default: return 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800/50 hover:bg-yellow-200 dark:hover:bg-yellow-900/60'; 
    }
  };

  const formatarDataBr = (dataSql) => {
    if (!dataSql) return '';
    const [ano, mes, dia] = dataSql.split('-');
    return `${dia}/${mes}`;
  };

  const registrosFiltrados = registros.filter(r => {
    const matchBusca = r.professor.toLowerCase().includes(busca.toLowerCase()) || (r.tema && r.tema.toLowerCase().includes(busca.toLowerCase()));
    const matchData = filtroData === 'Todas' || r.data === filtroData;
    const matchTipo = abaAtiva === 'Todas' || r.tipo_evento === abaAtiva;
    const matchTema = filtroTema === 'Todos' || (r.tema && r.tema.trim().toUpperCase() === filtroTema);
    const matchAno = r.data && r.data.startsWith(anoAtivo);
    return matchBusca && matchData && matchTipo && matchTema && matchAno;
  });

  const registrosDoAno = registros.filter(r => r.data && r.data.startsWith(anoAtivo));
  const diasDisponiveis = [...new Set(registrosDoAno.map(r => r.data))].filter(Boolean).sort();
  const temasDisponiveis = [...new Set(registrosDoAno.filter(r => r.tema).map(r => r.tema.trim().toUpperCase()))].sort();

  const exportarParaWord = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Grade de Programação</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #374151; }
          h1 { color: #047857; text-align: center; font-size: 22px; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
          .subtitle { text-align: center; color: #6b7280; font-size: 12px; margin-top: 0; margin-bottom: 25px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; border: 1px solid #e5e7eb; }
          th { background-color: #059669; color: #ffffff; font-weight: bold; padding: 12px 10px; text-align: left; font-size: 13px; text-transform: uppercase; border: 1px solid #047857; }
          td { padding: 10px; border: 1px solid #e5e7eb; font-size: 12px; vertical-align: middle; }
          .footer { margin-top: 40px; font-size: 10px; color: #9ca3af; text-align: right; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>Grade de Programação CIOSP - ${anoAtivo}</h1>
        <p class="subtitle">Eventos: ${abaAtiva} | Tema: ${filtroTema} | Data: ${filtroData}</p>
        
        <table>
          <thead>
            <tr>
              <th style="width: 20%;">PROFESSOR</th>
              <th style="width: 20%;">TEMA</th>
              <th style="width: 20%;">DESCRIÇÃO</th>
              <th style="width: 15%; text-align: center;">DATA</th>
              <th style="width: 5%; text-align: center;">HORA</th>
              <th style="width: 10%; text-align: center;">TIPO</th>
              <th style="width: 10%; text-align: center;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${registrosFiltrados.map((r, index) => {
              const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
              
              let statusColor = '#4b5563'; 
              if (r.status === 'Aprovado' || r.status === 'Sim') statusColor = '#059669'; 
              else if (r.status === 'Pendente') statusColor = '#d97706'; 
              else if (r.status === 'Não autorizado' || r.status === 'Não') statusColor = '#dc2626';

              return `
                <tr style="background-color: ${bgColor};">
                  <td><strong style="color: #111827;">${r.professor}</strong></td>
                  <td style="color: #4b5563;">${r.tema}</td>
                  <td style="color: #4b5563;">${r.descricao || '-'}</td>
                  <td style="text-align: center; color: #111827;">${formatarDataBr(r.data)}</td>
                  <td style="text-align: center; font-weight: bold; color: #111827;">${r.horario ? r.horario.substring(0,5) : '00:00'}</td>
                  <td style="text-align: center; color: #4b5563;">${r.tipo_evento}</td>
                  <td style="text-align: center; color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${r.status || 'PENDENTE'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          Documento gerado automaticamente pelo sistema Controle Master em ${dataAtual}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Grade_Programacao_CIOSP_${anoAtivo}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-10 min-h-screen text-gray-600 dark:text-gray-300 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 border-b border-gray-200 dark:border-emerald-500/10 pb-6">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white italic tracking-tighter uppercase">Grade <span className="text-emerald-600 dark:text-emerald-500 font-light">CIOSP {anoAtivo}</span></h2>
            <p className="text-emerald-600/60 dark:text-emerald-500/40 text-[10px] md:text-xs uppercase tracking-[0.3em] mt-1">Terminal de Gerenciamento</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex flex-1 md:flex-none items-center gap-2 bg-white dark:bg-[#0a0a0a] p-1.5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm overflow-x-auto scrollbar-hide w-full md:w-auto">
              {['2026', '2027'].map(ano => (
                <button key={ano} onClick={() => { setAnoAtivo(ano); setFiltroData('Todas'); setFiltroTema('Todos'); }} className={`px-3 md:px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex-1 text-center ${anoAtivo === ano ? 'bg-emerald-600 text-black shadow-md' : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>{ano}</button>
              ))}
            </div>
            
            <div className="w-full md:w-auto flex flex-row gap-2">
              <button onClick={exportarParaWord} className="flex-1 md:flex-none bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 px-4 md:px-6 py-3 rounded-xl flex justify-center items-center gap-2 font-black uppercase text-[10px] md:text-xs tracking-widest whitespace-nowrap transition">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Word</span>
              </button>
              <button onClick={() => { setIsEditing(false); setNovoRegistro({ professor: '', tema: '', data: '', horario: '', tipo_evento: 'Palestra', observacoes: '', descricao: '', contatado: false }); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-black px-4 md:px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 font-black uppercase text-[10px] md:text-xs tracking-widest whitespace-nowrap">
                <Plus className="w-4 h-4" /> Agendar
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide w-full">
          {['Todas', 'Palestra', 'Hands-On', 'Demonstração'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`px-4 md:px-6 py-2.5 rounded-xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap flex-shrink-0 ${abaAtiva === aba ? 'bg-emerald-600 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>{aba === 'Todas' ? 'Visão Geral' : aba}</button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white dark:bg-[#0a0a0a] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
          <div className="relative w-full md:flex-1 group">
            <Search className="absolute left-4 top-3 text-gray-400 dark:text-emerald-500/30 w-5 h-5" />
            <input type="text" placeholder="BUSCAR PROFESSOR OU TEMA..." className="pl-12 w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 p-2.5 rounded-xl text-gray-900 dark:text-white outline-none font-mono text-xs uppercase" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl px-2 w-full sm:w-auto">
              <Tag className="hidden sm:block text-gray-400 dark:text-emerald-500/50 w-5 h-5 ml-2" />
              <select className="w-full bg-transparent p-2.5 text-gray-900 dark:text-white outline-none font-mono text-xs uppercase cursor-pointer" value={filtroTema} onChange={(e) => setFiltroTema(e.target.value)}>
                <option value="Todos" className="bg-white dark:bg-[#111]">Todos os Temas</option>{temasDisponiveis.map(tema => <option key={tema} value={tema} className="bg-white dark:bg-[#111]">{tema}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl px-2 w-full sm:w-auto">
              <Calendar className="hidden sm:block text-gray-400 dark:text-emerald-500/50 w-5 h-5 ml-2" />
              <select className="w-full bg-transparent p-2.5 text-gray-900 dark:text-white outline-none font-mono text-xs uppercase cursor-pointer" value={filtroData} onChange={(e) => setFiltroData(e.target.value)}>
                <option value="Todas" className="bg-white dark:bg-[#111]">Todos os Dias</option>{diasDisponiveis.map(dia => <option key={dia} value={dia} className="bg-white dark:bg-[#111]">{formatarDataBr(dia)}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-xl dark:shadow-2xl">
          <div className="overflow-x-auto w-full scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em] font-black">
                  <th className="p-4 md:p-5">Professor</th><th className="p-4 md:p-5">Tema</th><th className="p-4 md:p-5">Data/Hora</th><th className="p-4 md:p-5">Tipo</th><th className="p-4 md:p-5">Contato</th><th className="p-4 md:p-5">Status</th><th className="p-4 md:p-5 text-right">Comandos</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono uppercase tracking-tighter">
                {registrosFiltrados.length > 0 ? registrosFiltrados.map((registro) => (
                    <motion.tr key={registro.id} className={`border-b transition-colors group ${getRowColor(registro.status)}`}>
                      <td className="p-4 md:p-5 font-bold text-gray-900 dark:text-white">{registro.professor}</td>
                      <td className="p-4 md:p-5 text-gray-700 dark:text-gray-300 text-xs">{registro.tema}</td>
                      <td className="p-4 md:p-5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatarDataBr(registro.data)} <span className="text-gray-500 dark:text-gray-400 ml-1">{registro.horario ? registro.horario.substring(0,5) : '00:00'}</span></td>
                      <td className="p-4 md:p-5 whitespace-nowrap"><span className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white rounded-lg text-[9px] font-black border border-gray-200 dark:border-white/10">{registro.tipo_evento}</span></td>
                      <td className="p-4 md:p-5 whitespace-nowrap">
                        {STATUS_COM_RESPOSTA.includes(registro.status) ? (
                          <span
                            title="Resposta já recebida - contato fixado automaticamente"
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black border bg-blue-200 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/50 opacity-80 cursor-default w-fit"
                          >
                            <MessageCircle className="w-3 h-3" /> Contato Confirmado
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => atualizarContato(registro.id, !registro.contatado)}
                            title={registro.contatado ? 'Contato feito - aguardando resposta do professor' : 'Marcar como contatado'}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black border transition-colors ${registro.contatado ? 'bg-blue-200 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/50' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}
                          >
                            <MessageCircle className="w-3 h-3" /> {registro.contatado ? 'Aguardando Resposta' : 'Não Contatado'}
                          </button>
                        )}
                      </td>
                      <td className="p-4 md:p-5 whitespace-nowrap"><span className={`px-3 py-1 rounded-lg text-[9px] font-black border ${getStatusColor(registro.status)}`}>{registro.status || 'PENDENTE'}</span></td>
                      <td className="p-4 md:p-5 text-right flex justify-end items-center gap-2 whitespace-nowrap">
                        <button onClick={() => abrirEdicao(registro)} className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-2"><Pencil className="w-4 h-4" /></button>
                        
                        {/* SELECT INTELIGENTE: Muda de acordo com o ano */}
                        <select 
                          value={registro.status || 'Pendente'} 
                          onChange={(e) => atualizarStatus(registro.id, e.target.value)} 
                          className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-2 py-1.5 text-[10px] font-black text-gray-900 dark:text-white outline-none cursor-pointer"
                        >
                          {registro.data && registro.data.startsWith('2026') ? (
                            <>
                              {/* Se ainda estiver como Pendente, mostra apenas como marcador para ele selecionar Sim/Não */}
                              {registro.status !== 'Sim' && registro.status !== 'Não' && (
                                <option value={registro.status || 'Pendente'} disabled className="bg-white dark:bg-[#0a0a0a] text-gray-400">
                                  {registro.status || 'Status?'}
                                </option>
                              )}
                              <option value="Sim" className="bg-white dark:bg-[#0a0a0a]">Sim</option>
                              <option value="Não" className="bg-white dark:bg-[#0a0a0a]">Não</option>
                            </>
                          ) : (
                            <>
                              <option value="Pendente" className="bg-white dark:bg-[#0a0a0a]">Pendente</option>
                              <option value="Aprovado" className="bg-white dark:bg-[#0a0a0a]">Aprovado</option>
                              <option value="Não autorizado" className="bg-white dark:bg-[#0a0a0a]">Não Autorizado</option>
                            </>
                          )}
                        </select>

                        <button onClick={() => abrirModalExclusao(registro.id)} className="text-gray-600 dark:text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </motion.tr>
                  )) : <tr><td colSpan="7" className="p-8 text-center text-gray-400 font-mono text-xs uppercase">Nenhum registro.</td></tr>}
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
                <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">{isEditing ? 'Atualizar Registro' : 'Novo Registro'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-6 h-6 md:w-5 md:h-5" /></button>
              </div>

              <form onSubmit={handleSalvarRegistro} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5 custom-scrollbar">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Professor / Profissional</label>
                    <input type="text" required className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoRegistro.professor} onChange={(e) => setNovoRegistro({...novoRegistro, professor: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Tema da Sessão</label>
                    <input type="text" required className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoRegistro.tema} onChange={(e) => setNovoRegistro({...novoRegistro, tema: e.target.value})} />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Data</label>
                      <input type="date" required className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoRegistro.data} onChange={(e) => setNovoRegistro({...novoRegistro, data: e.target.value})} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Horário</label>
                      <input type="time" required className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoRegistro.horario} onChange={(e) => setNovoRegistro({...novoRegistro, horario: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Classificação</label>
                    <select required className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase cursor-pointer" value={novoRegistro.tipo_evento} onChange={(e) => setNovoRegistro({...novoRegistro, tipo_evento: e.target.value})}>
                      <option value="Palestra">Palestra</option><option value="Hands-On">Hands-On</option><option value="Demonstração">Demonstração</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-blue-600 cursor-pointer" checked={novoRegistro.contatado} onChange={(e) => setNovoRegistro({...novoRegistro, contatado: e.target.checked})} />
                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Já entrei em contato - aguardando resposta do professor</span>
                  </label>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Descrição / Anotações</label>
                    <textarea 
                      rows="3"
                      className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase resize-none" 
                      value={novoRegistro.descricao} 
                      onChange={(e) => setNovoRegistro({...novoRegistro, descricao: e.target.value})} 
                      placeholder="Adicione anotações sobre este registro..."
                    ></textarea>
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 font-mono uppercase">O registro será excluído permanentemente.</p>
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