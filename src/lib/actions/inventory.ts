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

export async function createInventoryItem(input: {
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  min_threshold?: number;
  cost_per_unit?: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await getClinicId();
  if (!clinicId) return { success: false, error: 'غير مسجل دخول' };

  const { data, error } = await supabase
    .from('inventory')
    .insert({
      clinic_id: clinicId,
      name: input.name,
      category: input.category,
      quantity: input.quantity,
      unit: input.unit || null,
      min_threshold: input.min_threshold || 5,
      cost_per_unit: input.cost_per_unit || 0,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/stock');
  return { success: true, data: { item: data } };
}

export async function updateInventoryQuantity(
  id: string,
  type: 'in' | 'out',
  quantity: number,
  notes?: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await getClinicId();
  if (!clinicId) return { success: false, error: 'غير مسجل دخول' };

  // Get current quantity
  const { data: item } = await supabase.from('inventory').select('quantity').eq('id', id).single();
  if (!item) return { success: false, error: 'صنف غير موجود' };

  const newQty = type === 'in' ? Number(item.quantity) + quantity : Math.max(0, Number(item.quantity) - quantity);

  // Update inventory
  const { error: updateErr } = await supabase
    .from('inventory')
    .update({ quantity: newQty })
    .eq('id', id);

  if (updateErr) return { success: false, error: updateErr.message };

  // Log stock movement
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('stock_movements').insert({
    clinic_id: clinicId,
    inventory_id: id,
    type,
    quantity,
    notes: notes || null,
    created_by: user?.id || null,
  });

  revalidatePath('/stock');
  return { success: true };
}

export async function deleteInventoryItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('inventory').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/stock');
  return { success: true };
}
