import { useState, useEffect, useCallback } from 'react';
import { checkSubscriptionStatus } from '../lib/stripe';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from './useSession';

interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  plan: {
    id: string;
    product: string;
  };
}

export function useSubscription(redirectIfNotSubscribed = true) {
  const [status, setStatus] = useState<'loading' | 'never_subscribed' | 'expired' | 'active'>('loading');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSession();

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setStatus('never_subscribed');
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Verificando status da assinatura...');
      const data = await checkSubscriptionStatus();
      console.log('Status da assinatura:', data);
      
      setStatus(data.status);
      setSubscription(data.subscription || null);
      setLoading(false);
      
      // Retornar o status para que o useEffect decida sobre a navegação
      return data.status;
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      setError('Erro ao verificar assinatura');
      setStatus('never_subscribed');
      setSubscription(null);
      setLoading(false);
      return 'error';
    }
  }, [session]);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      if (mounted) {
        const status = await checkSubscription();
        
        // Fazer a navegação aqui, fora do render
        if (redirectIfNotSubscribed && 
            status !== 'active' && 
            !['/pricing', '/payment-success', '/login'].includes(location.pathname)) {
          console.log('Redirecionando para pricing:', {
            status,
            pathname: location.pathname
          });
          navigate('/pricing', { 
            state: { from: location },
            replace: true 
          });
        }
      }
    };

    check();
    
    return () => {
      mounted = false;
    };
  }, [checkSubscription, redirectIfNotSubscribed, location, navigate]);

  return { status, subscription, loading, error };
}
