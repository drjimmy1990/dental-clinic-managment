import { createClient } from '@/lib/supabase/server';

export default async function ReportsPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = now.toISOString().substring(0, 7) + '-01';

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('users').select('clinic_id').eq('id', user.id).single();
  if (!profile) return null;

  // Call the SQL RPC
  const { data: stats, error } = await supabase.rpc('get_dashboard_stats', {
    p_clinic_id: profile.clinic_id,
    p_month_start: monthStart
  });

  if (error || !stats) {
    return <div style={{ padding: 20 }}>Error loading reports: {error?.message}</div>;
  }

  const totalRevenue = Number((stats as any).totalRevenue) || 0;
  const totalExpenses = Number((stats as any).totalExpenses) || 0;
  const totalDebts = Number((stats as any).totalDebts) || 0;
  const labCosts = Number((stats as any).labCosts) || 0;
  const totalPatients = Number((stats as any).totalPatients) || 0;
  const totalAppointments = Number((stats as any).totalAppointments) || 0;
  const attended = Number((stats as any).attended) || 0;
  const cancelled = Number((stats as any).cancelled) || 0;
  
  const methodTotals = (stats as any).methodTotals as Record<string, number>;
  const typeTotals = (stats as any).typeTotals as Record<string, number>;
  const expCats = (stats as any).expCats as Record<string, number>;

  const netProfit = totalRevenue - totalExpenses;
  const attendanceRate = totalAppointments > 0 ? Math.round((attended / totalAppointments) * 100) : 0;

  const methodLabels: Record<string, string> = { cash: 'كاش', card: 'فيزا', vodafone: 'فودافون', transfer: 'تحويل' };

  const maxMethodVal = Math.max(...Object.values(methodTotals as Record<string, number>), 1);
  const maxTypeVal = Math.max(...Object.values(typeTotals as Record<string, number>), 1);
  const maxExpVal = Math.max(...Object.values(expCats as Record<string, number>), 1);

  return (
    <>
      <div className="sec-header">
        <div>
          <div className="sec-title">التقارير <span>📈</span></div>
          <div className="sec-sub">تقرير شهر {now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <span className="stat-num count-up" style={{ color: 'var(--green)' }}>{totalRevenue.toLocaleString()}</span>
          <div className="stat-label">إجمالي الإيرادات (ج.م)</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💸</span>
          <span className="stat-num count-up" style={{ color: 'var(--red)' }}>{totalExpenses.toLocaleString()}</span>
          <div className="stat-label">إجمالي المصاريف (ج.م)</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <span className="stat-num count-up" style={{ color: netProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>{netProfit.toLocaleString()}</span>
          <div className="stat-label">صافي الربح (ج.م)</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💳</span>
          <span className="stat-num count-up" style={{ color: totalDebts > 0 ? 'var(--gold)' : 'var(--green)' }}>{totalDebts.toLocaleString()}</span>
          <div className="stat-label">ديون معلقة (ج.م)</div>
        </div>
      </div>

      <div className="grid2" style={{ marginBottom: 24 }}>
        {/* Revenue by Payment Method */}
        <div className="card">
          <div className="card-header"><span className="card-title">💰 الإيراد حسب طريقة الدفع</span></div>
          <div className="card-body">
            {Object.keys(methodTotals).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد بيانات</div>
            ) : (
              <div className="chart-bar-wrap">
                {Object.entries(methodTotals).sort((a, b) => b[1] - a[1]).map(([method, total]) => (
                  <div className="chart-bar-item" key={method}>
                    <span className="bar-label">{methodLabels[method] || method}</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${(total / maxMethodVal) * 100}%`, background: 'linear-gradient(90deg, var(--teal), var(--cyan))' }} /></div>
                    <span className="bar-val">{total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Appointment Types */}
        <div className="card">
          <div className="card-header"><span className="card-title">📅 المواعيد حسب النوع</span></div>
          <div className="card-body">
            {Object.keys(typeTotals).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد بيانات</div>
            ) : (
              <div className="chart-bar-wrap">
                {Object.entries(typeTotals).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div className="chart-bar-item" key={type}>
                    <span className="bar-label">{type}</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${(count / maxTypeVal) * 100}%`, background: 'linear-gradient(90deg, var(--purple), var(--cyan))' }} /></div>
                    <span className="bar-val">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid2" style={{ marginBottom: 24 }}>
        {/* Expense Categories */}
        <div className="card">
          <div className="card-header"><span className="card-title">💸 المصاريف حسب الفئة</span></div>
          <div className="card-body">
            {Object.keys(expCats).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد بيانات</div>
            ) : (
              <div className="chart-bar-wrap">
                {Object.entries(expCats).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
                  <div className="chart-bar-item" key={cat}>
                    <span className="bar-label">{cat}</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${(total / maxExpVal) * 100}%`, background: 'linear-gradient(90deg, var(--red), var(--gold))' }} /></div>
                    <span className="bar-val">{total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="card">
          <div className="card-header"><span className="card-title">📊 ملخص الأداء</span></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>إجمالي المرضى</span>
                <span style={{ fontWeight: 800, fontSize: 18 }}>{totalPatients}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>مواعيد الشهر</span>
                <span style={{ fontWeight: 800, fontSize: 18 }}>{totalAppointments}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>نسبة الحضور</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: attendanceRate >= 70 ? 'var(--green)' : 'var(--red)' }}>{attendanceRate}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>إلغاءات / عدم حضور</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--red)' }}>{cancelled}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>تكاليف المعمل</span>
                <span style={{ fontWeight: 800, fontSize: 18 }}>{labCosts.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
