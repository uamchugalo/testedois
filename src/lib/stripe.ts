import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const API_URL = import.meta.env.VITE_API_URL;

export const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

// Verificar status da assinatura
export const checkSubscriptionStatus = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${API_URL}/api/subscription-status`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
};

// Criar sessão de checkout
export const createCheckoutSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar sessão de pagamento');
    }

    // Redirecionar para a página de checkout do Stripe
    window.location.href = data.url;
  } catch (error: any) {
    console.error('Erro:', error);
    throw error;
  }
};
