-- Migration 008: Frequent Drugs (Templates)

CREATE TABLE IF NOT EXISTS public.frequent_drugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    drug_name TEXT NOT NULL,
    dose TEXT,
    frequency TEXT,
    duration TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.frequent_drugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clinic frequent drugs" ON public.frequent_drugs
    FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their clinic frequent drugs" ON public.frequent_drugs
    FOR INSERT WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their clinic frequent drugs" ON public.frequent_drugs
    FOR UPDATE USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their clinic frequent drugs" ON public.frequent_drugs
    FOR DELETE USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));
