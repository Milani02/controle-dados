import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { CheckSquare, Square, Plus, X, Trash2, AlertTriangle, Pencil, Search, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AbaMateriais() {
  const [materiais, setMateriais] = useState([]);
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('Todas');
  const [subAba, setSubAba] = useState('Todas');
  const [balcaoAtivo, setBalcaoAtivo] = useState('Todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, idToDelete: null });

  const [novoMaterial, setNovoMaterial] = useState({
    nome: '', categoria: 'Materiais para Hands-On', quantidade: 1, verificado: false, balcao: ''
  });

  useEffect(() => { fetchMateriais(); }, []);

  const fetchMateriais = async () => {
    const { data } = await supabase.from('materiais').select('*').order('categoria', { ascending: true });
    if (data) setMateriais(data);
  };

  const abrirEdicao = (item) => {
    setIsEditing(true); setIdEmEdicao(item.id);
    const base = 'Materiais Biodinâmica - Vitrine e Demonstração';
    let categoria = item.categoria;
    let balcao = '';
    if (categoria?.startsWith(`${base} - `)) {
      balcao = categoria.replace(`${base} - `, '');
      categoria = base;
    }
    setNovoMaterial({ nome: item.nome, categoria, quantidade: item.quantidade, verificado: item.verificado || false, balcao });
    setIsModalOpen(true);
  };

  const handleTabChange = (aba) => {
    setAbaAtiva(aba);
    setSubAba('Todas');
    setBalcaoAtivo('Todos');
  };

  const alternarVerificacao = async (id, statusAtual) => {
    const novoStatus = !statusAtual; 
    const { error } = await supabase.from('materiais').update({ verificado: novoStatus }).eq('id', id);
    if (!error) setMateriais(materiais.map(m => m.id === id ? { ...m, verificado: novoStatus } : m));
  };

  const abrirModalExclusao = (id) => {
    setModalConfirmacao({ isOpen: true, idToDelete: id });
  };

  const confirmarExclusao = async () => {
    const id = modalConfirmacao.idToDelete;
    try {
      const { error } = await supabase.from('materiais').delete().eq('id', id);
      if (error) throw error;
      setMateriais(materiais.filter(m => m.id !== id));
      setModalConfirmacao({ isOpen: false, idToDelete: null });
    } catch (error) {
      alert("Erro ao excluir: " + error.message);
      setModalConfirmacao({ isOpen: false, idToDelete: null });
    }
  };

  const precisaBalcao = novoMaterial.categoria === 'Materiais Biodinâmica - Vitrine e Demonstração';

  const handleSalvarMaterial = async (e) => {
    e.preventDefault(); setLoadingForm(true);
    try {
      if (precisaBalcao && !novoMaterial.balcao) {
        alert("Selecione o balcão deste item."); setLoadingForm(false); return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert("Sessão expirada. Faça login novamente."); setLoadingForm(false); return; }

      const { balcao, ...materialParaSalvar } = novoMaterial;
      if (precisaBalcao) materialParaSalvar.categoria = `${novoMaterial.categoria} - ${balcao}`;

      if (isEditing) {
        const { error } = await supabase.from('materiais').update(materialParaSalvar).eq('id', idEmEdicao);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('materiais').insert([{ ...materialParaSalvar, user_id: user.id }]);
        if (error) throw error;
      }
      fetchMateriais(); setIsModalOpen(false); setIsEditing(false); setIdEmEdicao(null);
      setNovoMaterial({ nome: '', categoria: 'Materiais para Hands-On', quantidade: 1, verificado: false, balcao: '' });
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    } finally { setLoadingForm(false); }
  };

  const filtrados = materiais.filter(m => {
    const matchBusca = m.nome.toLowerCase().includes(busca.toLowerCase());
    let matchAba = false;
    if (abaAtiva === 'Todas') matchAba = true;
    else if (abaAtiva === 'Materiais para Hands-On') matchAba = m.categoria === 'Materiais para Hands-On';
    else if (abaAtiva === 'Materiais Oraltech') { matchAba = m.categoria?.includes('Oraltech'); if (subAba !== 'Todas') matchAba = matchAba && m.categoria?.includes(subAba); }
    else if (abaAtiva === 'Materiais Biodinâmica') {
      matchAba = m.categoria?.includes('Biodinâmica');
      if (subAba !== 'Todas') matchAba = matchAba && m.categoria?.includes(subAba);
      if (subAba === 'Vitrine e Demonstração' && balcaoAtivo !== 'Todos') matchAba = matchAba && m.categoria?.includes(balcaoAtivo);
    }
    return matchBusca && matchAba;
  });

  const subAbasPorAba = {
    'Materiais Oraltech': ['Todas', 'Vitrine', 'Demonstração', 'Materiais Auxiliares'],
    'Materiais Biodinâmica': ['Todas', 'Vitrine e Demonstração', 'Materiais Auxiliares'],
  };
  const balcoesDisponiveis = ['Todos', 'Balcão 1', 'Balcão 2', 'Balcão 3'];

  // FUNÇÃO DE EXPORTAR PARA WORD (COM ESTILO PREMIUM)
  const exportarParaWord = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Materiais</title>
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
        <h1>Controle de Insumos - Materiais</h1>
        <p class="subtitle">Categoria: ${abaAtiva === 'Todas' ? 'Visão Geral (Todos os itens)' : abaAtiva} ${subAba !== 'Todas' ? `> ${subAba}` : ''} ${subAba === 'Vitrine e Demonstração' && balcaoAtivo !== 'Todos' ? `> ${balcaoAtivo}` : ''}</p>
        
        <table>
          <thead>
            <tr>
              <th style="width: 15%; text-align: center;">STATUS</th>
              <th style="width: 40%;">ITEM / INSUMO</th>
              <th style="width: 30%;">CLASSIFICAÇÃO</th>
              <th style="width: 15%; text-align: center;">QUANTIDADE</th>
            </tr>
          </thead>
          <tbody>
            ${filtrados.map((item, index) => {
              // Alternância de cores (Zebra) feita por script para o Word reconhecer perfeitamente
              const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
              const statusHtml = item.verificado 
                ? '<span style="color: #059669; font-weight: bold;">✔ OK</span>' 
                : '<span style="color: #d97706; font-weight: bold;">☐ PENDENTE</span>';
              
              return `
                <tr style="background-color: ${bgColor};">
                  <td style="text-align: center;">${statusHtml}</td>
                  <td style="color: ${item.verificado ? '#9ca3af' : '#111827'}; font-weight: bold;">${item.nome}</td>
                  <td style="color: #4b5563;">${item.categoria}</td>
                  <td style="text-align: center; font-weight: bold; color: #111827;">${item.quantidade} UN</td>
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
    link.download = 'Inventario_Materiais.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-10 min-h-screen text-gray-600 dark:text-gray-300 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 border-b border-gray-200 dark:border-emerald-500/10 pb-6 md:pb-8">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white italic tracking-tighter uppercase">Controle <span className="text-emerald-600 dark:text-emerald-500 font-light">Materiais</span></h2>
            <p className="text-emerald-600/60 dark:text-emerald-500/40 text-[10px] md:text-xs uppercase tracking-[0.3em] mt-1">Terminal de Logística de Insumos</p>
          </div>
          <div className="w-full md:w-auto flex flex-row gap-2">
            <button onClick={exportarParaWord} className="flex-1 md:flex-none bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 px-4 md:px-6 py-3 rounded-xl flex justify-center items-center gap-2 font-black uppercase text-[10px] md:text-xs tracking-widest whitespace-nowrap transition">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Word</span>
            </button>
            <button onClick={() => { setIsEditing(false); setNovoMaterial({ nome: '', categoria: 'Materiais para Hands-On', quantidade: 1, verificado: false, balcao: '' }); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-black px-4 md:px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] flex justify-center items-center gap-2 font-black uppercase text-[10px] md:text-xs tracking-widest whitespace-nowrap transition">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide w-full">
          {['Todas', 'Materiais para Hands-On', 'Materiais Oraltech', 'Materiais Biodinâmica'].map(aba => (
            <button key={aba} onClick={() => handleTabChange(aba)} className={`px-4 md:px-6 py-2.5 rounded-xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap flex-shrink-0 ${abaAtiva === aba ? 'bg-emerald-600 text-black shadow-md' : 'bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>{aba === 'Todas' ? 'Visão Geral' : aba}</button>
          ))}
        </div>

        <AnimatePresence>
          {subAbasPorAba[abaAtiva] && (
            <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide w-full">
              {subAbasPorAba[abaAtiva].map(sub => (
                <button key={sub} onClick={() => { setSubAba(sub); setBalcaoAtivo('Todos'); }} className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[9px] md:text-[10px] tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${subAba === sub ? 'bg-gray-800 dark:bg-emerald-500/20 text-white dark:text-emerald-400 border border-gray-800 dark:border-emerald-500/30' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/5'}`}>{sub === 'Todas' ? (abaAtiva === 'Todas' ? 'Todas' : `Todas de ${abaAtiva.replace('Materiais ', '')}`) : sub}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {abaAtiva === 'Materiais Biodinâmica' && subAba === 'Vitrine e Demonstração' && (
            <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} className="flex gap-2 mb-6 -mt-4 overflow-x-auto pb-2 scrollbar-hide w-full">
              {balcoesDisponiveis.map(balcao => (
                <button key={balcao} onClick={() => setBalcaoAtivo(balcao)} className={`px-3 py-1 rounded-lg font-bold uppercase text-[9px] md:text-[10px] tracking-wider transition-all whitespace-nowrap flex-shrink-0 border ${balcaoAtivo === balcao ? 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border-emerald-600/40' : 'bg-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white border-gray-200 dark:border-white/5'}`}>{balcao}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8 mt-2 bg-white dark:bg-[#0a0a0a] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
          <div className="relative group">
            <Search className="absolute left-4 top-3 text-gray-400 dark:text-emerald-500/30 w-5 h-5" />
            <input type="text" placeholder="BUSCAR MATERIAL NO INVENTÁRIO..." className="pl-12 w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 p-2.5 rounded-xl text-gray-900 dark:text-white outline-none focus:border-emerald-500/50 transition-all font-mono text-xs uppercase" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-xl dark:shadow-2xl">
          <div className="overflow-x-auto w-full scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em] font-black">
                  <th className="p-4 md:p-5 w-12 text-center">St</th><th className="p-4 md:p-5">Item / Insumo</th><th className="p-4 md:p-5">Classificação</th><th className="p-4 md:p-5 w-32 text-center">Qtd</th><th className="p-4 md:p-5 text-right w-32">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono uppercase tracking-tighter">
                {filtrados.length > 0 ? filtrados.map((item) => (
                  <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={item.id} className="bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-[#222] transition-colors group">
                    <td className="p-4 md:p-5 text-center"><button onClick={() => alternarVerificacao(item.id, item.verificado)} className="text-gray-400 hover:text-emerald-500 transition-colors">{item.verificado ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-gray-400 dark:text-gray-600" />}</button></td>
                    <td className={`p-4 md:p-5 font-bold ${item.verificado ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>{item.nome}</td>
                    <td className="p-4 md:p-5 text-gray-600 dark:text-gray-400 text-[10px] md:text-xs leading-tight">{item.categoria}</td>
                    <td className="p-4 md:p-5 text-center font-black text-gray-900 dark:text-white"><span className="px-3 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg whitespace-nowrap">{item.quantidade} UN</span></td>
                    <td className="p-4 md:p-5 text-right flex justify-end items-center gap-2"><button onClick={() => abrirEdicao(item)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-2" title="Editar"><Pencil className="w-4 h-4" /></button><button onClick={() => abrirModalExclusao(item.id)} className="text-gray-400 hover:text-red-500 p-2" title="Excluir"><Trash2 className="w-4 h-4" /></button></td>
                  </motion.tr>
                )) : <tr><td colSpan="5" className="p-8 text-center text-gray-400 dark:text-gray-600 font-mono text-xs uppercase">Nenhum insumo localizado.</td></tr>}
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
                <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">{isEditing ? 'Atualizar Item' : 'Novo Item'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-6 h-6 md:w-5 md:h-5" /></button>
              </div>

              <form onSubmit={handleSalvarMaterial} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5 custom-scrollbar">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Nome do Insumo</label>
                    <input type="text" required placeholder="EX: RESINA BULK FILL" className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoMaterial.nome} onChange={(e) => setNovoMaterial({...novoMaterial, nome: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Classificação / Categoria</label>
                    <select required className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase cursor-pointer" value={novoMaterial.categoria} onChange={(e) => setNovoMaterial({...novoMaterial, categoria: e.target.value, balcao: ''})}>
                      <option value="Materiais para Hands-On" className="bg-white dark:bg-[#111]">Materiais para Hands-On</option>
                      <optgroup label="MARCA: ORALTECH" className="bg-gray-200 dark:bg-[#222] font-black text-emerald-700 dark:text-emerald-500">
                        <option value="Materiais Oraltech - Vitrine" className="bg-white dark:bg-[#111] font-normal text-gray-900 dark:text-gray-300">Vitrine (Oraltech)</option>
                        <option value="Materiais Oraltech - Demonstração" className="bg-white dark:bg-[#111] font-normal text-gray-900 dark:text-gray-300">Demonstração (Oraltech)</option>
                        <option value="Materiais Oraltech - Materiais Auxiliares" className="bg-white dark:bg-[#111] font-normal text-gray-900 dark:text-gray-300">Auxiliares (Oraltech)</option>
                      </optgroup>
                      <optgroup label="MARCA: BIODINÂMICA" className="bg-gray-200 dark:bg-[#222] font-black text-emerald-700 dark:text-emerald-500">
                        <option value="Materiais Biodinâmica - Vitrine e Demonstração" className="bg-white dark:bg-[#111] font-normal text-gray-900 dark:text-gray-300">Vitrine e Demonstração (Biodinâmica)</option>
                        <option value="Materiais Biodinâmica - Materiais Auxiliares" className="bg-white dark:bg-[#111] font-normal text-gray-900 dark:text-gray-300">Auxiliares (Biodinâmica)</option>
                      </optgroup>
                    </select>
                  </div>
                  {precisaBalcao && (
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Balcão</label>
                      <select required className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase cursor-pointer" value={novoMaterial.balcao} onChange={(e) => setNovoMaterial({...novoMaterial, balcao: e.target.value})}>
                        <option value="" disabled className="bg-white dark:bg-[#111]">Selecione o balcão</option>
                        <option value="Balcão 1" className="bg-white dark:bg-[#111]">Balcão 1</option>
                        <option value="Balcão 2" className="bg-white dark:bg-[#111]">Balcão 2</option>
                        <option value="Balcão 3" className="bg-white dark:bg-[#111]">Balcão 3</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Quantidade Mínima</label>
                    <input type="number" min="1" required className="w-full p-3 md:p-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none text-xs uppercase" value={novoMaterial.quantidade} onChange={(e) => setNovoMaterial({...novoMaterial, quantidade: parseInt(e.target.value) || 1})} />
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 font-mono uppercase">O item será excluído permanentemente.</p>
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