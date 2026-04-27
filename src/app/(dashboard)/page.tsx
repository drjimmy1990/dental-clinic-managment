import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.substring(0, 7) + '-01';

  // Parallel fetch all dashboard data
  const [
    patientsRes,
    appointmentsRes,
    paymentsRes,
    debtsRes,
    labOrdersRes,
    todayAppointmentsRes,
  ] = await Promise.all([
    supabase.from('patients').select('id, created_at', { count: 'exact' }),
    supabase.from('appointments').select('id, status', { count: 'exact' }).eq('date', today),
    supabase.from('payments').select('amount').gte('date', monthStart),
    supabase.from('debts').select('remaining_amount').eq('status', 'pending'),
    supabase.from('lab_orders').select('id', { count: 'exact' }).in('status', ['at_lab', 'delayed']),
    supabase.from('appointments')
      .select('*, patient:patients(id, full_name, phone, code)')
      .eq('date', today)
      .order('time', { ascending: true }),
  ]);

  const totalPatients = patientsRes.count || 0;
  const todayAppointmentsCount = appointmentsRes.count || 0;
  const monthlyRevenue = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalDebts = debtsRes.data?.reduce((sum, d) => sum + Number(d.remaining_amount), 0) || 0;
  const pendingLabOrders = labOrdersRes.count || 0;
  const todayAppointments = todayAppointmentsRes.data || [];

  const statusLabels: Record<string, { cls: string; label: string }> = {
    attended: { cls: 'badge-green', label: 'حضر ✓' },
    upcoming: { cls: 'badge-teal', label: 'قادم' },
    postponed: { cls: 'badge-gold', label: 'مؤجل' },
    cancelled: { cls: 'badge-red', label: 'ملغي' },
    no_show: { cls: 'badge-red', label: 'لم يحضر' },
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'م' : 'ص';
    const display = hour > 12 ? hour - 12 : hour || 12;
    return { time: `${display}:${m}`, ampm };
  };

  return (
    <>
      <div className="sec-header">
        <div>
          <div className="sec-title">لوحة التحكم <span>📊</span></div>
          <div className="sec-sub">نظرة عامة على العيادة</div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <span className="stat-num count-up">{monthlyRevenue.toLocaleString()}</span>
          <div className="stat-label">إيراد الشهر (ج.م)</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🧑‍⚕️</span>
          <span className="stat-num count-up">{totalPatients}</span>
          <div className="stat-label">إجمالي المرضى</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💳</span>
          <span className="stat-num count-up" style={{ color: totalDebts > 0 ? 'var(--red)' : 'var(--green)' }}>
            {totalDebts.toLocaleString()}
          </span>
          <div className="stat-label">ديون معلقة (ج.م)</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🧪</span>
          <span className="stat-num count-up">{pendingLabOrders}</span>
          <div className="stat-label">شغل المعمل</div>
        </div>
      </div>

      <div className="grid-main">
        {/* Today's Appointments */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📅 مواعيد اليوم ({todayAppointmentsCount})</span>
            <a href="/appointments" className="btn btn-outline btn-sm">عرض الكل</a>
          </div>
          <div className="card-body">
            {todayAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                لا توجد مواعيد اليوم
              </div>
            ) : (
              todayAppointments.map((appt) => {
                const { time, ampm } = formatTime(appt.time);
                const badge = statusLabels[appt.status] || statusLabels.upcoming;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const patient = appt.patient as any;
                return (
                  <div className="appt-item" key={appt.id} style={{ cursor: 'default' }}>
                    <div className="appt-time">
                      <div className="hour">{time}</div>
                      <div className="ampm">{ampm}</div>
                    </div>
                    <div className="appt-info">
                      <div className="appt-name">{patient?.full_name || 'مريض'}</div>
                      <div className="appt-type">{appt.type} • كرسي {appt.chair_number}</div>
                    </div>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">⚡ إجراءات سريعة</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="/patients" className="btn btn-primary" style={{ justifyContent: 'center' }}>➕ مريض جديد</a>
              <a href="/appointments" className="btn btn-outline" style={{ justifyContent: 'center' }}>📅 حجز موعد</a>
              <a href="/payments" className="btn btn-outline" style={{ justifyContent: 'center' }}>💰 تسجيل دفعة</a>
              <a href="/lab" className="btn btn-outline" style={{ justifyContent: 'center' }}>🧪 شغلة معمل</a>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📈 اليوم</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>مواعيد اليوم</span>
                  <span style={{ fontWeight: 800 }}>{todayAppointmentsCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>حضروا</span>
                  <span style={{ fontWeight: 800, color: 'var(--green)' }}>
                    {todayAppointments.filter(a => a.status === 'attended').length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>منتظرين</span>
                  <span style={{ fontWeight: 800, color: 'var(--cyan)' }}>
                    {todayAppointments.filter(a => a.status === 'upcoming').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
