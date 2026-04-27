import { getStaffMembers } from '@/lib/actions/staff';
import StaffClient from '@/components/settings/StaffClient';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'owner') {
    redirect('/');
  }

  const { data, error } = await getStaffMembers();
  
  // Need to safely cast to expected structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const staff = data?.staff as any[] || [];

  return (
    <>
      <div className="sec-header">
        <div>
          <div className="sec-title">إدارة الموظفين 👥</div>
          <div className="sec-sub">أضف الأطباء والمساعدين وموظفي الاستقبال</div>
        </div>
      </div>
      
      {error ? (
        <div className="alert-banner alert-red">{error}</div>
      ) : (
        <StaffClient initialStaff={staff} />
      )}
    </>
  );
}
