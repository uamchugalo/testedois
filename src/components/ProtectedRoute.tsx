import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useSubscription } from '../hooks/useSubscription';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresSubscription?: boolean;
}

export function ProtectedRoute({ children, requiresSubscription = true }: ProtectedRouteProps) {
  const location = useLocation();
  const { session, loading: sessionLoading } = useSession();
  const { status, loading: subscriptionLoading } = useSubscription(requiresSubscription);

  // Se estiver carregando, mostra loading
  if (sessionLoading || (requiresSubscription && subscriptionLoading)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver logado e não estiver em uma rota pública
  if (!session && !['/login', '/signup'].includes(location.pathname)) {
    console.log('Redirecionando para login - usuário não autenticado');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se precisar de assinatura, não estiver ativa e não estiver em uma rota permitida
  if (requiresSubscription && 
      status !== 'active' && 
      !['/pricing', '/payment-success', '/login', '/signup'].includes(location.pathname)) {
    console.log('Redirecionando para pricing - assinatura necessária', {
      status,
      pathname: location.pathname
    });
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  // Se estiver tudo ok, renderiza o conteúdo
  return <>{children}</>;
}
