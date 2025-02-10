import React from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const BotaoAssinatura = () => {
  const handleClick = async () => {
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe não inicializado');

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const session = await response.json();

      // Redireciona para o Checkout do Stripe
      const result = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });

      if (result.error) {
        console.error('Erro:', result.error);
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
    >
      Assinar por R$29,90/mês
    </button>
  );
};
