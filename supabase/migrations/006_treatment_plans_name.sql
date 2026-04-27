-- Migration 006: Add name to treatment_plans

ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS name TEXT;
