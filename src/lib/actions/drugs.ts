'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const drugSchema = z.object({
  drug_name: z.string().min(1, 'اسم الدواء مطلوب'),
  dose: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

async function getUserInfo() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { user: null, clinicId: null, role: null };

  const { data: userData } = await supabase
    .from('users')
    .select('clinic_id, role')
    .eq('id', user.id)
    .single();

  return { 
    user, 
    clinicId: userData?.clinic_id,
    role: userData?.role 
  };
}

export async function getFrequentDrugs() {
  const { clinicId } = await getUserInfo();
  if (!clinicId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('frequent_drugs')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('drug_name');

  return data || [];
}

export async function addFrequentDrug(formData: z.infer<typeof drugSchema>) {
  try {
    const parsed = drugSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { clinicId, role } = await getUserInfo();
    if (!clinicId) return { success: false, error: 'غير مصرح لك' };

    // Everyone except assistant/technician can add drugs (usually doctors/owners)
    if (role === 'assistant' || role === 'technician') {
      return { success: false, error: 'غير مصرح لك بإضافة أدوية' };
    }

    const supabase = await createClient();
    
    // Check if it already exists to prevent exact duplicates (optional)
    const { data: existing } = await supabase
      .from('frequent_drugs')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('drug_name', parsed.data.drug_name)
      .single();
      
    if (existing) {
      return { success: false, error: 'هذا الدواء موجود مسبقاً' };
    }

    const { error } = await supabase
      .from('frequent_drugs')
      .insert({
        clinic_id: clinicId,
        ...parsed.data
      });

    if (error) throw error;

    revalidatePath('/settings/drugs');
    revalidatePath('/patients/[id]', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ غير متوقع' };
  }
}

export async function deleteFrequentDrug(id: string) {
  try {
    const { clinicId, role } = await getUserInfo();
    if (!clinicId) return { success: false, error: 'غير مصرح لك' };

    if (role === 'assistant' || role === 'technician') {
      return { success: false, error: 'غير مصرح لك بحذف أدوية' };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('frequent_drugs')
      .delete()
      .eq('id', id)
      .eq('clinic_id', clinicId);

    if (error) throw error;

    revalidatePath('/settings/drugs');
    revalidatePath('/patients/[id]', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ' };
  }
}
