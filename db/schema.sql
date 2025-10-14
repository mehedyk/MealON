-- ============================================
-- MEALON - COMPLETE FRESH DATABASE SETUP
-- Run this ENTIRE file in Supabase SQL Editor
-- This will delete EVERYTHING and start fresh
-- ============================================

-- 🗑️ STEP 1: DELETE EVERYTHING (Nuclear Option)
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS members_insert ON members;
DROP POLICY IF EXISTS members_select ON members;
DROP POLICY IF EXISTS members_update ON members;
DROP POLICY IF EXISTS members_update_manager ON members;
DROP POLICY IF EXISTS members_delete ON members;

DROP POLICY IF EXISTS mess_insert ON mess;
DROP POLICY IF EXISTS mess_select ON mess;
DROP POLICY IF EXISTS mess_update ON mess;
DROP POLICY IF EXISTS mess_delete ON mess;

DROP POLICY IF EXISTS meals_insert ON meals;
DROP POLICY IF EXISTS meals_select ON meals;
DROP POLICY IF EXISTS meals_update ON meals;
DROP POLICY IF EXISTS meals_delete ON meals;

DROP POLICY IF EXISTS expenses_insert ON expenses;
DROP POLICY IF EXISTS expenses_select ON expenses;
DROP POLICY IF EXISTS expenses_update ON expenses;
DROP POLICY IF EXISTS expenses_delete ON expenses;

DROP POLICY IF EXISTS menu_items_insert ON menu_items;
DROP POLICY IF EXISTS menu_items_select ON menu_items;
DROP POLICY IF EXISTS menu_items_update ON menu_items;
DROP POLICY IF EXISTS menu_items_delete ON menu_items;

DROP POLICY IF EXISTS rules_insert ON rules;
DROP POLICY IF EXISTS rules_select ON rules;
DROP POLICY IF EXISTS rules_update ON rules;
DROP POLICY IF EXISTS rules_delete ON rules;

DROP POLICY IF EXISTS votes_insert ON votes;
DROP POLICY IF EXISTS votes_select ON votes;
DROP POLICY IF EXISTS votes_update ON votes;
DROP POLICY IF EXISTS votes_delete ON votes;

DROP POLICY IF EXISTS invitations_insert ON invitations;
DROP POLICY IF EXISTS invitations_select ON invitations;
DROP POLICY IF EXISTS invitations_update ON invitations;
DROP POLICY IF EXISTS invitations_delete ON invitations;

-- Drop all functions
DROP FUNCTION IF EXISTS create_mess_with_member CASCADE;

-- Drop all tables (in correct order - dependencies first)
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS rules CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS mess CASCADE;

-- ============================================
-- 🏗️ STEP 2: CREATE FRESH TABLES
-- ============================================

-- MESS TABLE (Main container for each mess)
CREATE TABLE mess (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mess_code VARCHAR(6) NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEMBERS TABLE (Users in each mess)
CREATE TABLE members (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mess_id BIGINT NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  country_code VARCHAR(10) DEFAULT '+880',
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mess_id)
);

-- MEALS TABLE (Track who ate what and when)
CREATE TABLE meals (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  meal_date DATE NOT NULL,
  breakfast BOOLEAN DEFAULT FALSE,
  lunch BOOLEAN DEFAULT FALSE,
  dinner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, meal_date)
);

-- EXPENSES TABLE (Track all expenses)
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  paid_by BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MENU_ITEMS TABLE (Daily menu planning)
CREATE TABLE menu_items (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  dish VARCHAR(255) NOT NULL,
  meal_type VARCHAR(20) NOT NULL,
  menu_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RULES TABLE (Mess rules)
CREATE TABLE rules (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VOTES TABLE (Manager voting)
CREATE TABLE votes (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  voter_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  candidate_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  voting_period VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voter_id, mess_id, voting_period)
);

-- INVITATIONS TABLE (Invite/join requests)
CREATE TABLE invitations (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  inviter_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
  invitee_email VARCHAR(255) NOT NULL,
  invitee_name VARCHAR(255),
  invitation_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_mess_id ON members(mess_id);
CREATE INDEX idx_meals_mess_id ON meals(mess_id);
CREATE INDEX idx_meals_meal_date ON meals(meal_date);
CREATE INDEX idx_expenses_mess_id ON expenses(mess_id);
CREATE INDEX idx_votes_mess_id ON votes(mess_id);

-- ============================================
-- 🔒 STEP 3: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE mess ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 🛡️ STEP 4: CREATE SIMPLE, WORKING RLS POLICIES
-- ============================================

-- MESS POLICIES (Simple and permissive)
CREATE POLICY mess_all ON mess
  FOR ALL
  TO authenticated
  USING (
    id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
    OR created_by = auth.uid()
  )
  WITH CHECK (created_by = auth.uid());

-- MEMBERS POLICIES
CREATE POLICY members_all ON members
  FOR ALL
  TO authenticated
  USING (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- MEALS POLICIES
CREATE POLICY meals_all ON meals
  FOR ALL
  TO authenticated
  USING (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
  );

-- EXPENSES POLICIES
CREATE POLICY expenses_all ON expenses
  FOR ALL
  TO authenticated
  USING (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
  );

-- MENU_ITEMS POLICIES
CREATE POLICY menu_items_all ON menu_items
  FOR ALL
  TO authenticated
  USING (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
  );

-- RULES POLICIES
CREATE POLICY rules_all ON rules
  FOR ALL
  TO authenticated
  USING (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
  );

-- VOTES POLICIES
CREATE POLICY votes_all ON votes
  FOR ALL
  TO authenticated
  USING (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
  );

-- INVITATIONS POLICIES
CREATE POLICY invitations_all ON invitations
  FOR ALL
  TO authenticated
  USING (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
    OR invitee_email = auth.email()
  )
  WITH CHECK (
    mess_id IN (SELECT mess_id FROM members WHERE user_id = auth.uid())
  );

-- ============================================
-- 🎯 STEP 5: CREATE THE MAGIC FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION create_mess_with_member(
  p_mess_name TEXT,
  p_user_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT '',
  p_country_code TEXT DEFAULT '+880'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mess_id BIGINT;
  v_member_id BIGINT;
  v_mess_code TEXT;
  v_result JSON;
BEGIN
  -- Validate ALL inputs
  IF p_mess_name IS NULL OR trim(p_mess_name) = '' THEN
    RAISE EXCEPTION 'Mess name is required';
  END IF;
  
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;
  
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- Generate unique 6-digit code
  LOOP
    v_mess_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM mess WHERE mess_code = v_mess_code);
  END LOOP;

  -- Create mess
  INSERT INTO mess (name, mess_code, created_by)
  VALUES (trim(p_mess_name), v_mess_code, p_user_id)
  RETURNING id INTO v_mess_id;

  -- Create member
  INSERT INTO members (
    user_id, 
    mess_id, 
    name, 
    email, 
    phone, 
    country_code, 
    role
  )
  VALUES (
    p_user_id,
    v_mess_id,
    trim(p_name),
    trim(p_email),
    COALESCE(trim(p_phone), ''),
    COALESCE(trim(p_country_code), '+880'),
    'manager'
  )
  RETURNING id INTO v_member_id;

  -- Return result
  SELECT json_build_object(
    'mess', json_build_object(
      'id', m.id,
      'name', m.name,
      'mess_code', m.mess_code,
      'created_by', m.created_by,
      'created_at', m.created_at
    ),
    'member', json_build_object(
      'id', mb.id,
      'user_id', mb.user_id,
      'mess_id', mb.mess_id,
      'name', mb.name,
      'email', mb.email,
      'phone', mb.phone,
      'country_code', mb.country_code,
      'role', mb.role,
      'created_at', mb.created_at
    )
  )
  INTO v_result
  FROM mess m
  JOIN members mb ON mb.mess_id = m.id
  WHERE m.id = v_mess_id AND mb.id = v_member_id;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_mess_with_member TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- ============================================
-- ✅ STEP 6: VERIFY EVERYTHING
-- ============================================

-- Check tables
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('mess', 'members', 'meals', 'expenses', 'menu_items', 'rules', 'votes', 'invitations')
ORDER BY tablename;

-- Check policies
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check function
SELECT 
  routine_name,
  security_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'create_mess_with_member';

-- ============================================
-- 🎉 SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '🎉 DATABASE RESET COMPLETE!';
  RAISE NOTICE '🎉 All tables, policies, and functions created';
  RAISE NOTICE '🎉 You can now test from your React app!';
  RAISE NOTICE '🎉 ============================================';
END $$;
