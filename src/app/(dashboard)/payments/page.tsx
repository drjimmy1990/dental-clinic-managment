import { createClient } from '@/lib/supabase/server';
import PaymentsClient from '@/components/payments/PaymentsClient';

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase.from('payments').select('*, patient:patients(id, full_name, code)').order('date', { ascending: false });
  const { data: patients } = await supabase.from('patients').select('*').order('full_name');
  return <PaymentsClient initialPayments={payments || []} patients={patients || []} />;
}
