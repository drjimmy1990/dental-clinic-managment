import { createClient } from '@/lib/supabase/server';

export default async function ReportsPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = now.toISOString().substring(0, 7) + '-01';

  // Fetch all data in parallel
  const [paymentsRes, expensesRes, debtsRes, appointmentsRes, patientsRes, labRes] = await Promise.all([
    supabase.from('payments').select('amount, method, date').gte('date', monthStart),
    supabase.from('expenses').select('amount, category, type').gte('month', monthStart),
    supabase.from('debts').select('total_amount, remaining_amount, status'),
    supabase.from('appointments').select('status, type, date').gte('date', monthStart),
    supabase.from('patients').select('id, created_at', { count: 'exact' }),
    supabase.from('lab_orders').select('cost, status'),
  ]);

  const payments = paymentsRes.data || [];
  const expenses = expensesRes.data || [];
  const debts = debtsRes.data || [];
  const appointments = appointmentsRes.data || [];
  const totalPatients = patientsRes.count || 0;
  const labOrders = labRes.data || [];

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalDebtsAmt = debts.filter(d => d.status !== 'paid').reduce((s, d) => s + Number(d.remaining_amount), 0);
  const labCosts = labOrders.reduce((s, l) => s + Number(l.cost), 0);

  // Payment methods breakdown
  const methodTotals: Record<string, number> = {};
  payments.forEach(p => { methodTotals[p.method] = (methodTotals[p.method] || 0) + Number(p.amount); });
  const methodLabels: Record<string, string> = { cash: 'كاش', card: 'فيزا', vodafone: 'فودافون', transfer: 'تحويل' };

  // Appointment types breakdown
  const typeTotals: Record<string, number> = {};
  appointments.forEach(a => { typeTotals[a.type] = (typeTotals[a.type] || 0) + 1; });

  // Appointment status breakdown
  const attended = appointments.filter(a => a.status === 'attended').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled' || a.status === 'no_show').length;
  const attendanceRate = appointments.length > 0 ? Math.round((attended / appointments.length) * 100) : 0;

  // Expense categories
  const expCats: Record<string, number> = {};
  expenses.forEach(e => { expCats[e.category] = (expCats[e.category] || 0) + Number(e.amount); });

  const maxMethodVal = Math.max(...Object.values(methodTotals), 1);
  const maxTypeVal = Math.max(...Object.values(typeTotals), 1);
  const maxExpVal = Math.max(...Object.values(expCats), 1);

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
          <span className="stat-num count-up" style={{ color: totalDebtsAmt > 0 ? 'var(--gold)' : 'var(--green)' }}>{totalDebtsAmt.toLocaleString()}</span>
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
                <span style={{ fontWeight: 800, fontSize: 18 }}>{appointments.length}</span>
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
