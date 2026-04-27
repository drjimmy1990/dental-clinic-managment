import { createClient } from '@/lib/supabase/server';
import PatientsClient from '@/components/patients/PatientsClient';

export default async function PatientsPage() {
  const supabase = await createClient();

  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  return <PatientsClient initialPatients={patients || []} />;
}
