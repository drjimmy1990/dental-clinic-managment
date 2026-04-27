import { createClient } from '@/lib/supabase/server';
import SalariesClient from '@/components/salaries/SalariesClient';

export default async function SalariesPage() {
  const supabase = await createClient();
  const { data: employees } = await supabase.from('employees').select('*').eq('is_active', true).order('full_name');
  const { data: records } = await supabase.from('salary_records').select('*, employee:employees(id, full_name, role)').order('month', { ascending: false });
  return <SalariesClient initialEmployees={employees || []} initialRecords={records || []} />;
}
