'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

async function getClinicId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('users').select('clinic_id').eq('id', user.id).single();
  return profile?.clinic_id || null;
}

export async function getDebts(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('debts')
    .select('*, patient:patients(id, full_name, code), supplier:suppliers(id, name)')
    .order('created_at', { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, data: { debts: data } };
}

export async function createDebt(input: {
  direction: 'patient_owes' | 'clinic_owes';
  patient_id?: string;
  supplier_id?: string;
  total_amount: number;
  remaining_amount: number;
  due_date?: string;
  notes?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await getClinicId();
  if (!clinicId) return { success: false, error: 'غير مسجل دخول' };

  const { data, error } = await supabase
    .from('debts')
    .insert({
      clinic_id: clinicId,
      direction: input.direction,
      patient_id: input.patient_id || null,
      supplier_id: input.supplier_id || null,
      total_amount: input.total_amount,
      remaining_amount: input.remaining_amount,
      due_date: input.due_date || null,
      notes: input.notes || null,
      status: 'pending',
    })
    .select('*, patient:patients(id, full_name, code), supplier:suppliers(id, name)')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/debts');
  revalidatePath('/');
  return { success: true, data: { debt: data } };
}

export async function updateDebtPayment(id: string, paymentAmount: number): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: debt } = await supabase.from('debts').select('remaining_amount').eq('id', id).single();
  if (!debt) return { success: false, error: 'لم يتم العثور على الدين' };

  const newRemaining = Math.max(0, Number(debt.remaining_amount) - paymentAmount);
  const newStatus = newRemaining === 0 ? 'paid' : 'partial';

  const { error } = await supabase
    .from('debts')
    .update({ remaining_amount: newRemaining, status: newStatus })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/debts');
  revalidatePath('/');
  return { success: true };
}

export async function deleteDebt(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('debts').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/debts');
  return { success: true };
}
