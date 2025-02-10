import { supabase } from './lib/supabase';

async function checkPrices() {
  const { data, error } = await supabase
    .from('service_prices')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Service Prices Data:', JSON.stringify(data, null, 2));
}

checkPrices();
