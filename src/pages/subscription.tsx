import React from 'react';
import { SubscriptionButton } from '../components/SubscriptionButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, Calendar, CheckCircle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

const SubscriptionPage = () => {
  const { subscription, loading } = useSubscription(false); // Não redirecionar automaticamente

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const expiresAt = subscription?.current_period_end 
    ? format(new Date(subscription.current_period_end * 1000), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        {/* Status da Assinatura */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Status da Assinatura</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isActive ? 'Ativa' : 'Inativa'}
              </div>
            </div>

            {isActive && (
              <div className="space-y-4">
                <div className="flex items-center text-gray-700">
                  <Calendar className="h-5 w-5 mr-3 text-blue-500" />
                  <span>Válida até {expiresAt}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <CreditCard className="h-5 w-5 mr-3 text-blue-500" />
                  <span>Plano Premium</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detalhes do Plano */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Plano Premium
            </h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="ml-3 text-gray-700">Acesso ilimitado ao sistema</span>
              </div>
              
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="ml-3 text-gray-700">Suporte prioritário</span>
              </div>
              
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="ml-3 text-gray-700">Recursos exclusivos</span>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-center mb-6">
                <span className="text-4xl font-bold">R$29,90</span>
                <span className="text-gray-600">/mês</span>
              </div>
              
              {isActive ? (
                <button
                  onClick={() => window.location.href = '/api/create-portal-session'}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Gerenciar Assinatura
                </button>
              ) : (
                <SubscriptionButton />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
