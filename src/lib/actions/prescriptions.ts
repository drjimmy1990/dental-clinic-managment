'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

export async function createPrescription(data: {
  patient_id: string;
  appointment_id?: string;
  notes?: string;
  items: Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    duration: string;
    notes?: string;
  }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('users')
    .select('clinic_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  // 1. Create prescription
  const { data: prescription, error: pError } = await supabase
    .from('prescriptions')
    .insert({
      clinic_id: profile.clinic_id,
      patient_id: data.patient_id,
      appointment_id: data.appointment_id || null,
      notes: data.notes
    })
    .select('id')
    .single();

  if (pError || !prescription) throw new Error(pError?.message || 'Failed to create prescription');

  // 2. Insert items
  if (data.items.length > 0) {
    const itemsToInsert = data.items.map(item => ({
      prescription_id: prescription.id,
      drug_name: item.drug_name,
      dose: item.dose,
      frequency: item.frequency,
      duration: item.duration,
      notes: item.notes || null
    }));

    const { error: itemsError } = await supabase
      .from('prescription_items')
      .insert(itemsToInsert);

    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath(`/patients/${data.patient_id}`);
  return { success: true, id: prescription.id };
}

export async function deletePrescription(id: string, patient_id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('prescriptions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath(`/patients/${patient_id}`);
  return { success: true };
}
