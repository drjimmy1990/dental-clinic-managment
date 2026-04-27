'use server';

import { createClient } from '@/lib/supabase/server';
import { paymentSchema, type PaymentInput } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';

type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

async function getUserInfo() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('users').select('clinic_id, role').eq('id', user.id).single();
  return profile || null;
}

export async function getPayments(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*, patient:patients(id, full_name, code)')
    .order('date', { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, data: { payments: data } };
}

export async function createPayment(input: PaymentInput): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo) return { success: false, error: 'غير مسجل دخول' };

  const { data, error } = await supabase
    .from('payments')
    .insert({ ...parsed.data, clinic_id: userInfo.clinic_id })
    .select('*, patient:patients(id, full_name, code)')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/payments');
  revalidatePath('/');
  return { success: true, data: { payment: data } };
}

export async function deletePayment(id: string): Promise<ActionResult> {
  const userInfo = await getUserInfo();
  if (!userInfo) return { success: false, error: 'غير مسجل دخول' };
  
  if (userInfo.role === 'secretary' || userInfo.role === 'assistant' || userInfo.role === 'technician') {
    return { success: false, error: 'غير مصرح لك بحذف المدفوعات' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/payments');
  revalidatePath('/');
  return { success: true };
}
