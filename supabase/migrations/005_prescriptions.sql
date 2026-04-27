-- Migration 005: Prescriptions Module

CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
    drug_name TEXT NOT NULL,
    dose TEXT,
    frequency TEXT,
    duration TEXT,
    notes TEXT
);

-- RLS Policies
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clinic prescriptions" ON public.prescriptions
    FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their clinic prescriptions" ON public.prescriptions
    FOR INSERT WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their clinic prescriptions" ON public.prescriptions
    FOR UPDATE USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their clinic prescriptions" ON public.prescriptions
    FOR DELETE USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));


CREATE POLICY "Users can view their clinic prescription_items" ON public.prescription_items
    FOR SELECT USING (prescription_id IN (SELECT id FROM public.prescriptions WHERE clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid())));

CREATE POLICY "Users can insert their clinic prescription_items" ON public.prescription_items
    FOR INSERT WITH CHECK (prescription_id IN (SELECT id FROM public.prescriptions WHERE clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid())));

CREATE POLICY "Users can update their clinic prescription_items" ON public.prescription_items
    FOR UPDATE USING (prescription_id IN (SELECT id FROM public.prescriptions WHERE clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid())));

CREATE POLICY "Users can delete their clinic prescription_items" ON public.prescription_items
    FOR DELETE USING (prescription_id IN (SELECT id FROM public.prescriptions WHERE clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid())));
