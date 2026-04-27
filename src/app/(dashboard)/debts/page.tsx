import { createClient } from '@/lib/supabase/server';
import DebtsClient from '@/components/debts/DebtsClient';

export default async function DebtsPage() {
  const supabase = await createClient();
  const { data: debts } = await supabase.from('debts').select('*, patient:patients(id, full_name, code), supplier:suppliers(id, name)').order('created_at', { ascending: false });
  const { data: patients } = await supabase.from('patients').select('*').order('full_name');
  return <DebtsClient initialDebts={debts || []} patients={patients || []} />;
}
