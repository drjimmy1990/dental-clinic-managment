-- Migration 003: Auth Trigger for Atomic Registration

-- 1. Create the function that will run when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_clinic_id UUID;
  c_name TEXT;
  d_name TEXT;
  c_phone TEXT;
BEGIN
  -- Extract metadata provided during signUp()
  c_name := NEW.raw_user_meta_data->>'clinicName';
  d_name := NEW.raw_user_meta_data->>'doctorName';
  c_phone := NEW.raw_user_meta_data->>'phone';

  -- If this is a main clinic registration (metadata exists)
  IF c_name IS NOT NULL THEN
    -- Insert the new clinic
    INSERT INTO public.clinics (name, doctor_name, phone)
    VALUES (c_name, d_name, c_phone)
    RETURNING id INTO new_clinic_id;

    -- Insert the user profile as 'owner'
    INSERT INTO public.users (id, clinic_id, full_name, role)
    VALUES (NEW.id, new_clinic_id, d_name, 'owner');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the trigger if it already exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
