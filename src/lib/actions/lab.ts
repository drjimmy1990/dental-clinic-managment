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

export async function createLabOrder(input: {
  patient_id: string;
  supplier_id?: string;
  type: string;
  shade?: string;
  tooth_numbers?: number[];
  sent_date?: string;
  expected_date?: string;
  cost?: number;
  notes?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await getClinicId();
  if (!clinicId) return { success: false, error: 'غير مسجل دخول' };

  const { data, error } = await supabase
    .from('lab_orders')
    .insert({
      clinic_id: clinicId,
      patient_id: input.patient_id,
      supplier_id: input.supplier_id || null,
      type: input.type,
      shade: input.shade || null,
      tooth_numbers: input.tooth_numbers || null,
      sent_date: input.sent_date || null,
      expected_date: input.expected_date || null,
      cost: input.cost || 0,
      notes: input.notes || null,
      status: 'at_lab',
    })
    .select('*, patient:patients(id, full_name, code), supplier:suppliers(id, name)')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/lab');
  revalidatePath('/');
  return { success: true, data: { order: data } };
}

export async function updateLabOrderStatus(
  id: string,
  status: 'at_lab' | 'ready' | 'received' | 'delayed' | 'cancelled',
  receivedDate?: string
): Promise<ActionResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = { status };
  if (status === 'received') updates.received_date = receivedDate || new Date().toISOString().split('T')[0];

  const { error } = await supabase.from('lab_orders').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/lab');
  revalidatePath('/');
  return { success: true };
}

export async function deleteLabOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('lab_orders').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/lab');
  return { success: true };
}
