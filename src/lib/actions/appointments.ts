'use server';

import { createClient } from '@/lib/supabase/server';
import { appointmentSchema, type AppointmentInput } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';

type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

export async function getAppointments(filters?: {
  date?: string;
  status?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();

  let query = supabase
    .from('appointments')
    .select('*, patient:patients(id, full_name, phone, code)')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (filters?.date) {
    query = query.eq('date', filters.date);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) return { success: false, error: error.message };
  return { success: true, data: { appointments: data } };
}

export async function createAppointment(input: AppointmentInput): Promise<ActionResult> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مسجل دخول' };

  const { data: profile } = await supabase
    .from('users')
    .select('clinic_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'لم يتم العثور على الملف الشخصي' };

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...parsed.data,
      clinic_id: profile.clinic_id,
      doctor_id: user.id,
    })
    .select('*, patient:patients(id, full_name, phone, code)')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/appointments');
  revalidatePath('/');
  return { success: true, data: { appointment: data } };
}

export async function updateAppointmentStatus(
  id: string,
  status: 'upcoming' | 'attended' | 'postponed' | 'cancelled' | 'no_show'
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/appointments');
  revalidatePath('/');
  return { success: true };
}

export async function deleteAppointment(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/appointments');
  revalidatePath('/');
  return { success: true };
}

export async function completeAppointmentFlow(input: {
  appointment_id: string;
  patient_id: string;
  type: string;
  tooth_numbers?: number[];
  cost: number;
  paid_amount: number;
  payment_method: string;
  notes?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مسجل' };

  const { data: profile } = await supabase
    .from('users')
    .select('clinic_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'لم يتم العثور على الملف الشخصي' };
  const clinicId = profile.clinic_id;

  // 1. Create Procedure
  const { data: proc, error: procErr } = await supabase.from('procedures').insert({
    clinic_id: clinicId, appointment_id: input.appointment_id, patient_id: input.patient_id,
    type: input.type, tooth_numbers: input.tooth_numbers || null, cost: input.cost, notes: input.notes || null
  }).select().single();
  
  if (procErr) return { success: false, error: procErr.message };

  // 2. Create Payment if paid_amount > 0
  if (input.paid_amount > 0) {
    await supabase.from('payments').insert({
      clinic_id: clinicId, patient_id: input.patient_id, procedure_id: proc.id,
      amount: input.paid_amount, method: input.payment_method
    });
  }

  // 3. Handle Debt if cost > paid_amount
  const remaining = input.cost - input.paid_amount;
  if (remaining > 0) {
    const { data: existingDebt } = await supabase.from('debts')
      .select('*')
      .eq('patient_id', input.patient_id)
      .eq('direction', 'patient_owes')
      .in('status', ['pending', 'partial'])
      .maybeSingle();

    if (existingDebt) {
      const newTotal = Number(existingDebt.total_amount) + remaining;
      const newRem = Number(existingDebt.remaining_amount) + remaining;
      await supabase.from('debts').update({ total_amount: newTotal, remaining_amount: newRem, status: 'partial' }).eq('id', existingDebt.id);
    } else {
      await supabase.from('debts').insert({
        clinic_id: clinicId, direction: 'patient_owes', patient_id: input.patient_id,
        total_amount: remaining, remaining_amount: remaining, status: 'pending'
      });
    }
  }

  // 4. Update Appointment Status
  await supabase.from('appointments').update({ status: 'attended' }).eq('id', input.appointment_id);

  revalidatePath('/appointments');
  revalidatePath('/patients');
  revalidatePath('/payments');
  revalidatePath('/debts');
  return { success: true };
}
