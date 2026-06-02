import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../services/supabase'; // Ajuste o caminho se necessário

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verifica se existe uma sessão ativa (se o usuário está logado) no momento em que ele tenta entrar na página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // Terminou de carregar a verificação
    });

    // 2. Fica escutando caso a sessão mude (ex: o usuário clicou em 'Sair')
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Enquanto o Supabase verifica se o cara está logado, mostramos uma tela de carregamento para não piscar a tela errada
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Carregando...</p> 
      </div>
    );
  }

  // Se a verificação terminou e NÃO tem sessão (não está logado), redireciona pro login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Se tem sessão (está logado), deixa ele ver a página (Dashboard)
  return children;
}