import { createClient } from '@supabase/supabase-js';

// Usando as variáveis diretamente
const supabaseUrl = 'https://fbtwddvbinsqhppmczkz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidHdkZHZiaW5zcWhwcG1jemt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MzYyMTksImV4cCI6MjA1MzMxMjIxOX0.jncJa1OAV-6tQ9LE__Tc7uzTAfB3Sr8CT-Ze3aSf0oU';

console.log('Inicializando Supabase com:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  key: supabaseAnonKey.substring(0, 20) + '...' // Log apenas parte da chave por segurança
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key são obrigatórios');
}

// Cria uma única instância do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Desabilitado para evitar loops
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
    debug: true // Habilita logs de debug
  }
});

// Adiciona listener global para mudanças de autenticação (apenas uma vez)
let authListenerInitialized = false;
if (!authListenerInitialized) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.email);
  });
  authListenerInitialized = true;
}

// Verifica se a configuração está correta
supabase.auth.getSession().then(({ data: { session } }) => {
  console.log('Sessão inicial:', session ? 'Válida' : 'Inválida');
}).catch(error => {
  console.error('Erro ao verificar sessão:', error);
});

export type { User } from '@supabase/supabase-js';