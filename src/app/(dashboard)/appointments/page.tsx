import { createClient } from '@/lib/supabase/server';
import AppointmentsClient from '@/components/appointments/AppointmentsClient';

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, patient:patients(id, full_name, phone, code)')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .order('full_name', { ascending: true });

  return (
    <AppointmentsClient
      initialAppointments={appointments || []}
      patients={patients || []}
    />
  );
}
