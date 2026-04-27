import { createClient } from '@/lib/supabase/server';
import MaintenanceClient from '@/components/maintenance/MaintenanceClient';

export default async function MaintenancePage() {
  const supabase = await createClient();
  const { data: equipment } = await supabase.from('equipment').select('*').order('name');
  return <MaintenanceClient initialEquipment={equipment || []} />;
}
