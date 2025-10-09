-- ============================================
-- COMPLETE SUPABASE SQL SCHEMA WITH AUTH
-- MealON - Mess Management App
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (if re-running)
-- ============================================
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS rules CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS mess CASCADE;

-- ============================================
-- TABLE: mess
-- Stores mess/group information with unique code
-- ============================================
CREATE TABLE mess (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mess_code VARCHAR(10) UNIQUE NOT NULL, -- Unique 6-digit code
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to generate unique 6-digit mess code
CREATE OR REPLACE FUNCTION generate_mess_code()
RETURNS VARCHAR(10) AS $$
DECLARE
  new_code VARCHAR(10);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 6-digit code
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM mess WHERE mess_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate mess code
CREATE OR REPLACE FUNCTION set_mess_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mess_code IS NULL OR NEW.mess_code = '' THEN
    NEW.mess_code := generate_mess_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_mess
  BEFORE INSERT ON mess
  FOR EACH ROW
  EXECUTE FUNCTION set_mess_code();

-- ============================================
-- TABLE: members
-- Stores member information with roles
-- ============================================
CREATE TABLE members (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  mess_id BIGINT REFERENCES mess(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  country_code VARCHAR(5) DEFAULT '+880',
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('manager', 'second_in_command', 'member')),
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mess_id) -- One user can only be in one mess once
);

-- Indexes
CREATE INDEX idx_members_mess_id ON members(mess_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_role ON members(role);

-- ============================================
-- TABLE: invitations
-- Stores pending invitations and join requests
-- ============================================
CREATE TABLE invitations (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT REFERENCES mess(id) ON DELETE CASCADE,
  inviter_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255) NOT NULL,
  invitee_name VARCHAR(255),
  invitation_type VARCHAR(20) CHECK (invitation_type IN ('email_invite', 'join_request')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invitations_mess_id ON invitations(mess_id);
CREATE INDEX idx_invitations_email ON invitations(invitee_email);
CREATE INDEX idx_invitations_status ON invitations(status);

-- ============================================
-- TABLE: meals
-- ============================================
CREATE TABLE meals (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT REFERENCES mess(id) ON DELETE CASCADE,
  member_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
  meal_date DATE NOT NULL,
  breakfast BOOLEAN DEFAULT FALSE,
  lunch BOOLEAN DEFAULT FALSE,
  dinner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, meal_date)
);

CREATE INDEX idx_meals_mess_id ON meals(mess_id);
CREATE INDEX idx_meals_member_id ON meals(member_id);
CREATE INDEX idx_meals_meal_date ON meals(meal_date);

-- ============================================
-- TABLE: expenses
-- ============================================
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT REFERENCES mess(id) ON DELETE CASCADE,
  paid_by BIGINT REFERENCES members(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  category VARCHAR(50) NOT NULL CHECK (category IN ('groceries', 'utilities', 'misc')),
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_expenses_mess_id ON expenses(mess_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);

-- ============================================
-- TABLE: menu_items
-- ============================================
CREATE TABLE menu_items (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT REFERENCES mess(id) ON DELETE CASCADE,
  dish VARCHAR(255) NOT NULL,
  meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  menu_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_menu_items_mess_id ON menu_items(mess_id);
CREATE INDEX idx_menu_items_menu_date ON menu_items(menu_date);

-- ============================================
-- TABLE: rules
-- ============================================
CREATE TABLE rules (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT REFERENCES mess(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rules_mess_id ON rules(mess_id);

-- ============================================
-- TABLE: votes
-- ============================================
CREATE TABLE votes (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT REFERENCES mess(id) ON DELETE CASCADE,
  voter_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
  candidate_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
  voting_period VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voter_id, mess_id, voting_period)
);

CREATE INDEX idx_votes_mess_id ON votes(mess_id);

-- ============================================
-- AUTO-UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mess_updated_at BEFORE UPDATE ON mess
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE mess ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Mess policies
CREATE POLICY "Users can view their own mess"
  ON mess FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM members WHERE mess_id = mess.id));

CREATE POLICY "Users can create mess"
  ON mess FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Managers can update their mess"
  ON mess FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM members 
    WHERE mess_id = mess.id AND role IN ('manager', 'second_in_command')
  ));

-- Members policies
CREATE POLICY "Members can view mess members"
  ON members FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM members WHERE mess_id = members.mess_id
  ));

CREATE POLICY "Managers can insert members"
  ON members FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM members 
      WHERE mess_id = members.mess_id AND role IN ('manager', 'second_in_command')
    )
  );

CREATE POLICY "Members can update own profile"
  ON members FOR UPDATE
  USING (auth.uid() = user_id);

-- Invitations policies
CREATE POLICY "Users can view invitations for their email"
  ON invitations FOR SELECT
  USING (
    auth.jwt() ->> 'email' = invitee_email OR
    auth.uid() IN (SELECT user_id FROM members WHERE mess_id = invitations.mess_id)
  );

CREATE POLICY "Managers can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM members 
      WHERE mess_id = invitations.mess_id AND role IN ('manager', 'second_in_command')
    )
  );

CREATE POLICY "Managers and invitees can update invitations"
  ON invitations FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM members 
      WHERE mess_id = invitations.mess_id AND role IN ('manager', 'second_in_command')
    ) OR
    auth.jwt() ->> 'email' = invitee_email
  );

-- Meals policies
CREATE POLICY "Members can view mess meals"
  ON meals FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM members WHERE mess_id = meals.mess_id
  ));

CREATE POLICY "Members can log their own meals"
  ON meals FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM members WHERE id = meals.member_id)
  );

CREATE POLICY "Members can update their own meals"
  ON meals FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM members WHERE id = meals.member_id)
  );

-- Expenses policies
CREATE POLICY "Members can view mess expenses"
  ON expenses FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM members WHERE mess_id = expenses.mess_id
  ));

CREATE POLICY "Members can add expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM members WHERE mess_id = expenses.mess_id)
  );

-- Menu items policies
CREATE POLICY "Members can view mess menu"
  ON menu_items FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM members WHERE mess_id = menu_items.mess_id
  ));

CREATE POLICY "Members can add menu items"
  ON menu_items FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM members WHERE mess_id = menu_items.mess_id)
  );

-- Rules policies
CREATE POLICY "Members can view mess rules"
  ON rules FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM members WHERE mess_id = rules.mess_id
  ));

CREATE POLICY "Managers can manage rules"
  ON rules FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM members 
      WHERE mess_id = rules.mess_id AND role IN ('manager', 'second_in_command')
    )
  );

-- Votes policies
CREATE POLICY "Members can view and cast votes"
  ON votes FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM members WHERE mess_id = votes.mess_id
  ));

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Database schema created successfully with authentication!';
  RAISE NOTICE '✅ All tables, indexes, and triggers created';
  RAISE NOTICE '✅ Row Level Security enabled with proper policies';
  RAISE NOTICE '🚀 Your secure database is ready!';
END $$;
