'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ToothStatus } from '@/types';

type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

export async function getDentalRecords(patientId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('dental_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('tooth_number', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: { records: data } };
}

export async function updateToothStatus(
  patientId: string,
  toothNumber: number,
  status: ToothStatus,
  notes?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مسجل دخول' };

  const { data: profile } = await supabase
    .from('users')
    .select('clinic_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'لم يتم العثور على الملف الشخصي' };

  // Upsert: update if exists, insert if not
  const { error } = await supabase
    .from('dental_records')
    .upsert(
      {
        clinic_id: profile.clinic_id,
        patient_id: patientId,
        tooth_number: toothNumber,
        status,
        notes: notes || null,
      },
      { onConflict: 'patient_id,tooth_number' }
    );

  if (error) return { success: false, error: error.message };

  revalidatePath(`/patients/${patientId}`);
  return { success: true };
}
