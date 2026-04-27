'use server';

import { createClient } from '@/lib/supabase/server';
import { patientSchema, type PatientInput } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

export async function getPatients(search?: string): Promise<ActionResult> {
  const supabase = await createClient();

  let query = supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (search && search.trim()) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) return { success: false, error: error.message };
  return { success: true, data: { patients: data } };
}

export async function getPatient(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { patient: data } };
}

export async function createPatient(input: PatientInput): Promise<ActionResult> {
  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Get user's clinic_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مسجل دخول' };

  const { data: profile } = await supabase
    .from('users')
    .select('clinic_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'لم يتم العثور على الملف الشخصي' };

  const { count } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', profile.clinic_id);

  const patientNumber = (count || 0) + 1;
  const code = `P-${patientNumber.toString().padStart(3, '0')}`;

  const { data, error } = await supabase
    .from('patients')
    .insert({
      ...parsed.data,
      clinic_id: profile.clinic_id,
      code,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/patients');
  revalidatePath('/');
  return { success: true, data: { patient: data } };
}

export async function updatePatient(id: string, input: PatientInput): Promise<ActionResult> {
  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('patients')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/patients');
  revalidatePath(`/patients/${id}`);
  revalidatePath('/');
  return { success: true, data: { patient: data } };
}

export async function deletePatient(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/patients');
  revalidatePath('/');
  return { success: true };
}
