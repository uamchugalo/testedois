import React from 'react';
import { useStripe } from '@stripe/stripe-js';
import { createCheckoutSession } from '../lib/stripe';

export const SubscriptionButton = () => {
  const stripe = useStripe();

  const handleSubscription = async () => {
    try {
      // Substitua pelo seu Price ID do Stripe
      const session = await createCheckoutSession('price_XXXXX');
      
      if (session.sessionId) {
        const result = await stripe?.redirectToCheckout({
          sessionId: session.sessionId,
        });

        if (result?.error) {
          console.error(result.error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <button
      onClick={handleSubscription}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Assinar por R$29,90/mês
    </button>
  );
};
