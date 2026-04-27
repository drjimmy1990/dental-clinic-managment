import { createClient } from '@/lib/supabase/server';
import ExpensesClient from '@/components/expenses/ExpensesClient';

export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: expenses } = await supabase.from('expenses').select('*').order('month', { ascending: false });
  return <ExpensesClient initialExpenses={expenses || []} />;
}
