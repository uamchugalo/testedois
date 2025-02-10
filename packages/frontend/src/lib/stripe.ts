import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL;

export async function checkSubscriptionStatus() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No session');
  }

  const response = await fetch(`${API_URL}/subscription-status`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch subscription status');
  }

  return response.json();
}
