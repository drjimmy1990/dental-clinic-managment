'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ActionResult = { success: boolean; error?: string };

export async function updateClinicInfo(input: {
  name: string;
  doctor_name?: string;
  phone?: string;
  address?: string;
  working_hours?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مسجل' };

  const { data: profile } = await supabase.from('users').select('clinic_id').eq('id', user.id).single();
  if (!profile) return { success: false, error: 'لم يتم العثور على الملف الشخصي' };

  const { error } = await supabase
    .from('clinics')
    .update({
      name: input.name,
      doctor_name: input.doctor_name || null,
      phone: input.phone || null,
      address: input.address || null,
      working_hours: input.working_hours || null,
    })
    .eq('id', profile.clinic_id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  revalidatePath('/');
  return { success: true };
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: error.message };
  return { success: true };
}
