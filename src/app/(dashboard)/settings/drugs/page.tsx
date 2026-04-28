import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DrugsClient from '@/components/settings/DrugsClient';
import { getFrequentDrugs } from '@/lib/actions/drugs';

export const metadata = {
  title: 'الأدوية المتكررة | DentaCare Pro',
};

export default async function DrugsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role === 'assistant' || userData?.role === 'technician') {
    redirect('/'); // Block access for unauthorized roles
  }

  const frequentDrugs = await getFrequentDrugs();

  return (
    <div className="page slide-in">
      <div className="sec-header">
        <div>
          <div className="sec-title">الأدوية المتكررة <span>💊</span></div>
          <div className="sec-sub">إدارة كتالوج الأدوية لتسريع كتابة الروشتات</div>
        </div>
      </div>

      <DrugsClient initialDrugs={frequentDrugs} />
    </div>
  );
}
