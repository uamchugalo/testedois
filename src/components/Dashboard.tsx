import React, { useState } from 'react';
import { ServiceOrderForm } from './ServiceOrderForm';
import { MaterialsManagement } from './MaterialsManagement';
import { AccountingDashboard } from './AccountingDashboard';
import { CompanyInfo } from './CompanyInfo';
import { ServiceOrderList } from './ServiceOrderList';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Wrench, ClipboardList, Calculator, Settings, List, Building2, LogOut, User, ChevronDown, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSubscription } from '../hooks/useSubscription';

export function Dashboard() {
  const [currentTab, setCurrentTab] = useState('orders');
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'orders':
        return <ServiceOrderForm />;
      case 'order-list':
        return <ServiceOrderList />;
      case 'materials':
        return <MaterialsManagement />;
      case 'accounting':
        return <AccountingDashboard />;
      case 'company':
        return <CompanyInfo />;
      default:
        return <ServiceOrderForm />;
    }
  };

  const SubscriptionPopover = () => {
    const { subscription } = useSubscription(false);
    
    if (!subscription) return null;

    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const expiresAt = subscription.current_period_end 
      ? format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      : null;

    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-lg p-4 w-full">
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Status</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isActive ? (subscription.cancel_at_period_end ? 'Cancelamento Agendado' : 'Ativa') : 'Inativa'}
            </span>
          </div>
        </div>
        
        {isActive && expiresAt && (
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {subscription.cancel_at_period_end ? 'Acesso até' : 'Próxima cobrança'}
              </span>
              <span className="text-sm text-gray-600">{expiresAt}</span>
            </div>
          </div>
        )}
        
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Plano</span>
            <span className="text-sm text-gray-600">Premium</span>
          </div>
        </div>

        <button
          onClick={() => window.location.href = '/api/create-portal-session'}
          className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {subscription.cancel_at_period_end ? 'Reativar Assinatura' : 'Gerenciar Assinatura'}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Navigation */}
      <nav className="bg-white shadow-sm hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Wrench className="h-8 w-8 text-blue-500" />
                <span className="ml-2 text-xl font-bold text-gray-900">Sistema OS</span>
              </div>
              <div className="ml-6 flex space-x-8">
                <button
                  onClick={() => setCurrentTab('orders')}
                  className={`${
                    currentTab === 'orders'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <ClipboardList className="h-5 w-5 mr-1" />
                  Nova OS
                </button>
                <button
                  onClick={() => setCurrentTab('order-list')}
                  className={`${
                    currentTab === 'order-list'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <List className="h-5 w-5 mr-1" />
                  Lista de OS
                </button>
                <button
                  onClick={() => setCurrentTab('materials')}
                  className={`${
                    currentTab === 'materials'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Settings className="h-5 w-5 mr-1" />
                  Materiais e Serviços
                </button>
                <button
                  onClick={() => setCurrentTab('accounting')}
                  className={`${
                    currentTab === 'accounting'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Calculator className="h-5 w-5 mr-1" />
                  Financeiro
                </button>
                <button
                  onClick={() => setCurrentTab('company')}
                  className={`${
                    currentTab === 'company'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Building2 className="h-5 w-5 mr-1" />
                  Empresa
                </button>
              </div>
            </div>
            <div className="flex items-center">
              {/* Menu do usuário */}
              <div className="relative ml-3">
                <div>
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center max-w-xs text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Abrir menu do usuário</span>
                    <span className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Minha Conta
                    </span>
                  </button>
                </div>

                {/* Menu dropdown */}
                <div
                  className={`${
                    isOpen ? 'block' : 'hidden'
                  } origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex={-1}
                >
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Perfil
                  </Link>
                  
                  {/* Item de Assinatura com Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSubscriptionOpen(!isSubscriptionOpen);
                      }}
                      className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none group"
                      role="menuitem"
                    >
                      <span>Assinatura</span>
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isSubscriptionOpen ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {/* Detalhes da Assinatura */}
                    <div 
                      className={`${
                        isSubscriptionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      } overflow-hidden transition-all duration-200 ease-in-out`}
                    >
                      <div className="px-2 py-2">
                        <SubscriptionPopover />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="sm:hidden bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center">
            <Wrench className="h-6 w-6 text-blue-500" />
            <span className="ml-2 text-lg font-bold text-gray-900">Sistema OS</span>
          </div>
          <div className="flex items-center">
            {/* Menu do usuário */}
            <div className="relative ml-3">
              <div>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center max-w-xs text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">Abrir menu do usuário</span>
                  <span className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Minha Conta
                  </span>
                </button>
              </div>

              {/* Menu dropdown */}
              <div
                className={`${
                  isOpen ? 'block' : 'hidden'
                } origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
                tabIndex={-1}
              >
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Perfil
                </Link>
                
                {/* Item de Assinatura com Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSubscriptionOpen(!isSubscriptionOpen);
                    }}
                    className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none group"
                    role="menuitem"
                  >
                    <span>Assinatura</span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isSubscriptionOpen ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {/* Detalhes da Assinatura */}
                  <div 
                    className={`${
                      isSubscriptionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden transition-all duration-200 ease-in-out`}
                  >
                    <div className="px-2 py-2">
                      <SubscriptionPopover />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-8 mb-16 sm:mb-8 mt-14 sm:mt-0">
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5 h-[4.5rem] px-1">
          <button
            onClick={() => setCurrentTab('orders')}
            className={`flex flex-col items-center justify-center py-1 ${
              currentTab === 'orders' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="text-[0.65rem] mt-0.5 leading-tight">Nova OS</span>
          </button>
          <button
            onClick={() => setCurrentTab('order-list')}
            className={`flex flex-col items-center justify-center py-1 ${
              currentTab === 'order-list' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <List className="h-5 w-5" />
            <span className="text-[0.65rem] mt-0.5 leading-tight">Lista OS</span>
          </button>
          <button
            onClick={() => setCurrentTab('materials')}
            className={`flex flex-col items-center justify-center py-1 ${
              currentTab === 'materials' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[0.65rem] mt-0.5 leading-tight">Materiais e Serviços</span>
          </button>
          <button
            onClick={() => setCurrentTab('accounting')}
            className={`flex flex-col items-center justify-center py-1 ${
              currentTab === 'accounting' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <Calculator className="h-5 w-5" />
            <span className="text-[0.65rem] mt-0.5 leading-tight">Financeiro</span>
          </button>
          <button
            onClick={() => setCurrentTab('company')}
            className={`flex flex-col items-center justify-center py-1 ${
              currentTab === 'company' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <Building2 className="h-5 w-5" />
            <span className="text-[0.65rem] mt-0.5 leading-tight">Empresa</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
