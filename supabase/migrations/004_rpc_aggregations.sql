-- Migration 004: Dashboard Aggregations RPC

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_clinic_id UUID, p_month_start DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_revenue numeric;
  v_expenses numeric;
  v_debts numeric;
  v_lab_costs numeric;
  v_patients integer;
  v_appointments integer;
  v_attended integer;
  v_cancelled integer;
  v_method_totals json;
  v_type_totals json;
  v_exp_cats json;
BEGIN
  -- 1. Total Revenue
  SELECT COALESCE(SUM(amount), 0) INTO v_revenue FROM payments WHERE clinic_id = p_clinic_id AND date >= p_month_start;
  
  -- 2. Total Expenses
  SELECT COALESCE(SUM(amount), 0) INTO v_expenses FROM expenses WHERE clinic_id = p_clinic_id AND month >= p_month_start;

  -- 3. Total Debts
  SELECT COALESCE(SUM(remaining_amount), 0) INTO v_debts FROM debts WHERE clinic_id = p_clinic_id AND status != 'paid';

  -- 4. Lab Costs
  SELECT COALESCE(SUM(cost), 0) INTO v_lab_costs FROM lab_orders WHERE clinic_id = p_clinic_id;

  -- 5. Total Patients
  SELECT COUNT(*) INTO v_patients FROM patients WHERE clinic_id = p_clinic_id;

  -- 6. Appointments
  SELECT COUNT(*) INTO v_appointments FROM appointments WHERE clinic_id = p_clinic_id AND date >= p_month_start;
  SELECT COUNT(*) INTO v_attended FROM appointments WHERE clinic_id = p_clinic_id AND date >= p_month_start AND status = 'attended';
  SELECT COUNT(*) INTO v_cancelled FROM appointments WHERE clinic_id = p_clinic_id AND date >= p_month_start AND status IN ('cancelled', 'no_show');

  -- 7. Method Totals
  SELECT json_object_agg(method, total) INTO v_method_totals
  FROM (
    SELECT method, SUM(amount) as total FROM payments WHERE clinic_id = p_clinic_id AND date >= p_month_start GROUP BY method
  ) sub;

  -- 8. Type Totals
  SELECT json_object_agg(type, cnt) INTO v_type_totals
  FROM (
    SELECT type, COUNT(*) as cnt FROM appointments WHERE clinic_id = p_clinic_id AND date >= p_month_start GROUP BY type
  ) sub;

  -- 9. Expense Cats
  SELECT json_object_agg(category, total) INTO v_exp_cats
  FROM (
    SELECT category, SUM(amount) as total FROM expenses WHERE clinic_id = p_clinic_id AND month >= p_month_start GROUP BY category
  ) sub;

  RETURN json_build_object(
    'totalRevenue', v_revenue,
    'totalExpenses', v_expenses,
    'totalDebts', v_debts,
    'labCosts', v_lab_costs,
    'totalPatients', v_patients,
    'totalAppointments', v_appointments,
    'attended', v_attended,
    'cancelled', v_cancelled,
    'methodTotals', COALESCE(v_method_totals, '{}'::json),
    'typeTotals', COALESCE(v_type_totals, '{}'::json),
    'expCats', COALESCE(v_exp_cats, '{}'::json)
  );
END;
$$;
