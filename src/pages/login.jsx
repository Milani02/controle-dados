import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

// IMPORTANTE: Altere o nome abaixo para o nome real do seu arquivo de vídeo
import videoBackground from '../assets/ciosp2026.mp4'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert("Acesso negado: " + error.message);
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      
      {/* VÍDEO DE FUNDO EM LOOP */}
      <video 
        autoPlay 
        muted 
        loop 
        playsInline 
        className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover opacity-60"
      >
        <source src={videoBackground} type="video/mp4" />
      </video>

      {/* OVERLAY DE GRADIENTE PRETO (Vignette) */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/80 via-transparent to-black/90" />

      {/* CARD GLASSMORPHISM */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-20 glass-card p-10 rounded-3xl w-full max-w-md neon-glow border-t border-emerald-500/40"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="bg-emerald-500/20 p-4 rounded-2xl mb-4 border border-emerald-500/30">
            <ShieldCheck className="w-10 h-10 text-emerald-500 neon-text" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic neon-text uppercase">
            CIOSP <span className="text-emerald-500">2026</span>
          </h1>
          <div className="h-1 w-20 bg-emerald-500 mt-2 rounded-full shadow-[0_0_15px_#10b981]" />
          <p className="text-emerald-400/50 text-[10px] uppercase tracking-[0.3em] mt-4 font-bold">
            Protocolo de Segurança Ativo
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative group">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="email" 
              required
              placeholder="USUÁRIO@SISTEMA"
              className="w-full bg-black/40 border border-emerald-500/20 pl-11 p-3 rounded-xl text-emerald-50 transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-emerald-900 font-mono text-sm"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full bg-black/40 border border-emerald-500/20 pl-11 p-3 rounded-xl text-emerald-50 transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-emerald-900"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(16, 185, 129, 0.6)" }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] uppercase tracking-widest text-sm"
          >
            {loading ? 'AUTENTICANDO...' : 'ENTRAR NO TERMINAL'}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-emerald-900 text-[10px] font-mono uppercase tracking-tight">
            Acesso restrito à equipe Biodinâmica - Paraná, Brasil
          </p>
        </div>
      </motion.div>

      {/* EFEITO DE PARTÍCULAS OU DECORAÇÃO (OPCIONAL) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-15 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/20 blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-emerald-900/20 blur-[120px]" />
      </div>
    </div>
  );
}