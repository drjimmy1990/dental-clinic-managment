'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

export async function getStaffMembers(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مسجل دخول' };

  // Get user profile to find clinic_id
  const { data: profile } = await supabase.from('users').select('clinic_id, role').eq('id', user.id).single();
  if (!profile || profile.role !== 'owner') return { success: false, error: 'غير مصرح لك' };

  // Get all users in the same clinic
  const { data: staff, error } = await supabase
    .from('users')
    .select('*')
    .eq('clinic_id', profile.clinic_id)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };

  return { success: true, data: { staff } };
}

export async function createStaffMember(input: { full_name: string; email: string; password?: string; role: string }): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مسجل دخول' };

  const { data: profile } = await supabase.from('users').select('clinic_id, role').eq('id', user.id).single();
  if (!profile || profile.role !== 'owner') return { success: false, error: 'غير مصرح لك' };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'يجب تكوين SUPABASE_SERVICE_ROLE_KEY لإضافة الموظفين' };
  }

  // Create Auth User via Admin API
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password || 'password123', // Default password if none provided
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      role: input.role,
      clinic_id: profile.clinic_id
    }
  });

  if (authError) return { success: false, error: authError.message };

  revalidatePath('/settings/staff');
  return { success: true, data: { user: authData.user } };
}

export async function toggleStaffStatus(userId: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مسجل دخول' };

  const { data: profile } = await supabase.from('users').select('clinic_id, role').eq('id', user.id).single();
  if (!profile || profile.role !== 'owner') return { success: false, error: 'غير مصرح لك' };

  // Don't let owner deactivate themselves
  if (userId === user.id) {
    return { success: false, error: 'لا يمكنك إيقاف حسابك الخاص' };
  }

  // Ensure target user belongs to the same clinic
  const { data: targetUser } = await supabase.from('users').select('clinic_id').eq('id', userId).single();
  if (targetUser?.clinic_id !== profile.clinic_id) {
    return { success: false, error: 'المستخدم غير موجود أو لا ينتمي لعيادتك' };
  }

  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/settings/staff');
  return { success: true };
}
