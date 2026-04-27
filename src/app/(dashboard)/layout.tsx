import { createClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/layout/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let clinicName = '';
  let doctorName = '';
  let userRole = 'assistant';

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, role, clinic:clinics(name)')
      .eq('id', user.id)
      .single();

    if (profile) {
      doctorName = profile.full_name;
      userRole = profile.role;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clinic = profile.clinic as any;
      clinicName = clinic?.name || '';
    }
  }

  return (
    <DashboardShell clinicName={clinicName} doctorName={doctorName} userRole={userRole}>
      {children}
    </DashboardShell>
  );
}
