import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/settings/SettingsClient';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('clinic_id').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const { data: clinic } = await supabase.from('clinics').select('*').eq('id', profile.clinic_id).single();
  if (!clinic) redirect('/login');

  return <SettingsClient clinic={clinic} />;
}
