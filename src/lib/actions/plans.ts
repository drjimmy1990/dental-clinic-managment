'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTreatmentPlan(data: { patient_id: string; name: string; total_cost: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('users')
    .select('clinic_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const { data: plan, error } = await supabase
    .from('treatment_plans')
    .insert({
      clinic_id: profile.clinic_id,
      patient_id: data.patient_id,
      name: data.name,
      total_cost: data.total_cost,
      total_paid: 0,
      status: 'active'
    })
    .select('id')
    .single();

  if (error || !plan) throw new Error(error?.message || 'Failed to create plan');

  // Create a debt record for this plan so it appears in the main debts list
  await supabase.from('debts').insert({
    clinic_id: profile.clinic_id,
    patient_id: data.patient_id,
    direction: 'patient_owes',
    total_amount: data.total_cost,
    remaining_amount: data.total_cost,
    notes: `خطة علاج: ${data.name} (Plan ID: ${plan.id})`,
    status: 'pending'
  });

  revalidatePath(`/patients/${data.patient_id}`);
  return { success: true, id: plan.id };
}

export async function payForTreatmentPlan(data: { plan_id: string; patient_id: string; amount: number; method: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('users').select('clinic_id').eq('id', user.id).single();
  if (!profile) throw new Error('Profile not found');

  // 1. Create payment record linked to the plan
  const { error: paymentError } = await supabase.from('payments').insert({
    clinic_id: profile.clinic_id,
    patient_id: data.patient_id,
    treatment_plan_id: data.plan_id,
    amount: data.amount,
    method: data.method,
    notes: 'دفعة خطة علاج'
  });

  if (paymentError) throw new Error(paymentError.message);

  // 2. Update the treatment plan's total_paid
  const { data: plan } = await supabase.from('treatment_plans').select('total_cost, total_paid').eq('id', data.plan_id).single();
  if (plan) {
    const newPaid = Number(plan.total_paid) + data.amount;
    const newStatus = newPaid >= Number(plan.total_cost) ? 'completed' : 'active';
    await supabase.from('treatment_plans').update({ total_paid: newPaid, status: newStatus }).eq('id', data.plan_id);
  }

  // 3. Update the matching debt record using the notes (hacky but works since we don't have treatment_plan_id in debts)
  const { data: debts } = await supabase.from('debts')
    .select('*')
    .eq('patient_id', data.patient_id)
    .like('notes', `%Plan ID: ${data.plan_id}%`)
    .limit(1);

  if (debts && debts.length > 0) {
    const debt = debts[0];
    const newRemaining = Math.max(0, Number(debt.remaining_amount) - data.amount);
    const debtStatus = newRemaining === 0 ? 'paid' : 'partial';
    await supabase.from('debts').update({ remaining_amount: newRemaining, status: debtStatus }).eq('id', debt.id);
  }

  revalidatePath(`/patients/${data.patient_id}`);
  revalidatePath('/payments');
  revalidatePath('/debts');
  return { success: true };
}
