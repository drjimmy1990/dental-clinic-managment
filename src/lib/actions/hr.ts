'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ActionResult = { success: boolean; error?: string; data?: Record<string, unknown> };

async function getClinicId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('users').select('clinic_id').eq('id', user.id).single();
  return profile?.clinic_id || null;
}

export async function createExpense(input: { category: string; type: 'fixed' | 'variable'; amount: number; month: string; notes?: string }): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await getClinicId();
  if (!clinicId) return { success: false, error: 'غير مسجل' };
  const { data, error } = await supabase.from('expenses').insert({ clinic_id: clinicId, ...input, notes: input.notes || null }).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/expenses');
  return { success: true, data: { expense: data } };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/expenses');
  return { success: true };
}

export async function createEmployee(input: { full_name: string; role: string; base_salary: number }): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await getClinicId();
  if (!clinicId) return { success: false, error: 'غير مسجل' };
  const { data, error } = await supabase.from('employees').insert({ clinic_id: clinicId, ...input }).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/salaries');
  return { success: true, data: { employee: data } };
}

export async function createSalaryRecord(input: { employee_id: string; month: string; base_amount: number; bonuses: number; deductions: number; net_amount: number }): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await getClinicId();
  if (!clinicId) return { success: false, error: 'غير مسجل' };
  const { data, error } = await supabase.from('salary_records').insert({ clinic_id: clinicId, ...input, status: 'pending' }).select('*, employee:employees(id, full_name, role)').single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/salaries');
  return { success: true, data: { record: data } };
}

export async function paySalary(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('salary_records').update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/salaries');
  return { success: true };
}
