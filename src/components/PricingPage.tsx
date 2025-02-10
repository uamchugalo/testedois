import React, { useState } from 'react';
import { createCheckoutSession } from '../lib/stripe';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { useSession } from '../hooks/useSession';
import toast from 'react-hot-toast';

export function PricingPage() {
  const { status, loading: subscriptionLoading } = useSubscription(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: sessionLoading } = useSession();

  // Mostra loading enquanto verifica sessão e assinatura
  if (sessionLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver logado, redireciona para login
  if (!session) {
    navigate('/login', { 
      state: { from: location }, 
      replace: true 
    });
    return null;
  }

  // Se já tiver assinatura ativa, redireciona para o dashboard
  if (status === 'active') {
    const destination = location.state?.from?.pathname || '/dashboard';
    navigate(destination, { replace: true });
    return null;
  }

  const handleSubscribe = async () => {
    try {
      setError(null);
      await createCheckoutSession();
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao processar pagamento';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Planos e Preços
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Escolha o plano que melhor se adapta às suas necessidades
          </p>
        </div>

        <div className="mt-12">
          <div className="rounded-lg shadow-lg overflow-hidden">
            <div className="bg-white px-6 py-8 lg:p-12">
              <h3 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Plano Premium
              </h3>
              <p className="mt-6 text-base text-gray-500">
                Acesso completo a todas as funcionalidades
              </p>
              <div className="mt-8">
                <div className="flex items-center">
                  <h4 className="flex-shrink-0 pr-4 text-sm font-semibold uppercase tracking-wider text-indigo-600">
                    O que está incluído
                  </h4>
                  <div className="flex-1 border-t-2 border-gray-200"></div>
                </div>
                <ul className="mt-8 space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5">
                  {[
                    'Acesso ilimitado',
                    'Suporte premium',
                    'Atualizações gratuitas',
                    'Recursos exclusivos',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start lg:col-span-1">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="ml-3 text-sm text-gray-700">{feature}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <div className="rounded-lg shadow-sm">
                  <button
                    onClick={handleSubscribe}
                    className="block w-full text-center rounded-lg border border-transparent bg-indigo-600 px-6 py-4 text-xl leading-6 font-medium text-white hover:bg-indigo-700"
                  >
                    Assinar Agora
                  </button>
                </div>
                {error && (
                  <p className="mt-4 text-sm text-red-600">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
