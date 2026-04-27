-- Migration 007: Update Auth Trigger for Staff Management

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  target_clinic_id UUID;
  target_role TEXT;
BEGIN
  -- Check if user is being invited to an existing clinic (Staff flow)
  IF new.raw_user_meta_data->>'clinic_id' IS NOT NULL THEN
    target_clinic_id := (new.raw_user_meta_data->>'clinic_id')::UUID;
    target_role := COALESCE(new.raw_user_meta_data->>'role', 'assistant');
  ELSE
    -- Owner registration flow: create a new clinic
    INSERT INTO public.clinics (name)
    VALUES ('عيادتي')
    RETURNING id INTO target_clinic_id;
    target_role := 'owner';
  END IF;

  -- Insert the user
  INSERT INTO public.users (id, full_name, role, clinic_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    target_role,
    target_clinic_id
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
