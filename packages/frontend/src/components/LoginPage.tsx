import React, { useEffect } from 'react';
import { Auth } from './Auth';
import { useSession } from '../hooks/useSession';
import { useNavigate, useLocation } from 'react-router-dom';

export function LoginPage() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (session?.user && !loading) {
      console.log('LoginPage: Usuário autenticado, redirecionando...', {
        email: session.user.email,
        from: location.state?.from?.pathname
      });
      
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    }
  }, [session, loading, navigate, location]);

  // Se estiver carregando, mostra loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  // Se não estiver logado, mostra o formulário de login
  if (!session?.user) {
    return <Auth />;
  }

  // Retorna null enquanto o redirecionamento acontece
  return null;
}
