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

export async function createEquipment(input: {
  name: string;
  service_company?: string;
  maintenance_cost?: number;
  next_maintenance?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await getClinicId();
  if (!clinicId) return { success: false, error: 'غير مسجل دخول' };

  const { data, error } = await supabase
    .from('equipment')
    .insert({
      clinic_id: clinicId,
      name: input.name,
      service_company: input.service_company || null,
      maintenance_cost: input.maintenance_cost || 0,
      next_maintenance: input.next_maintenance || null,
      status: 'active',
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/maintenance');
  return { success: true, data: { equipment: data } };
}

export async function logMaintenance(input: {
  equipment_id: string;
  date: string;
  company?: string;
  cost?: number;
  notes?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await getClinicId();
  if (!clinicId) return { success: false, error: 'غير مسجل دخول' };

  // Create maintenance record
  const { error: recErr } = await supabase.from('maintenance_records').insert({
    clinic_id: clinicId,
    equipment_id: input.equipment_id,
    date: input.date,
    company: input.company || null,
    cost: input.cost || 0,
    notes: input.notes || null,
  });
  if (recErr) return { success: false, error: recErr.message };

  // Update equipment dates
  const { error: eqErr } = await supabase
    .from('equipment')
    .update({
      last_maintenance: input.date,
      status: 'active',
    })
    .eq('id', input.equipment_id);

  if (eqErr) return { success: false, error: eqErr.message };
  revalidatePath('/maintenance');
  return { success: true };
}

export async function updateEquipmentStatus(
  id: string,
  status: 'active' | 'needs_maintenance' | 'under_maintenance' | 'decommissioned'
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('equipment').update({ status }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/maintenance');
  return { success: true };
}
