import { createClient } from '@/lib/supabase/server';
import LabClient from '@/components/lab/LabClient';

export default async function LabPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase.from('lab_orders').select('*, patient:patients(id, full_name, code), supplier:suppliers(id, name)').order('created_at', { ascending: false });
  const { data: patients } = await supabase.from('patients').select('*').order('full_name');
  return <LabClient initialOrders={orders || []} patients={patients || []} />;
}
