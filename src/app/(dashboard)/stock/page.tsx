import { createClient } from '@/lib/supabase/server';
import StockClient from '@/components/stock/StockClient';

export default async function StockPage() {
  const supabase = await createClient();
  const { data: items } = await supabase.from('inventory').select('*').order('name');
  return <StockClient initialItems={items || []} />;
}
