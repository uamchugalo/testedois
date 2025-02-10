import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Função para atualizar o estado da sessão
    const updateSession = (newSession: Session | null) => {
      if (mounted) {
        setSession(newSession);
        setLoading(false);
      }
    };

    // Carrega a sessão inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      updateSession(initialSession);
    });

    // Inscreve para mudanças de sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateSession(session);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return { session, loading };
}
