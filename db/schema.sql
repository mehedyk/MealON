-- ============================================
-- COMPLETE SUPABASE SQL SCHEMA
-- Mess Management App
-- Copy this ENTIRE file and run in Supabase SQL Editor
-- ============================================

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (if re-running)
-- Uncomment these lines if you want to start fresh
-- ============================================
-- DROP TABLE IF EXISTS votes CASCADE;
-- DROP TABLE IF EXISTS rules CASCADE;
-- DROP TABLE IF EXISTS menu_items CASCADE;
-- DROP TABLE IF EXISTS expenses CASCADE;
-- DROP TABLE IF EXISTS meals CASCADE;
-- DROP TABLE IF EXISTS members CASCADE;
-- DROP TABLE IF EXISTS mess CASCADE;

-- ============================================
-- TABLE: mess
-- Stores mess/group information
-- ============================================
CREATE TABLE mess (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: members
-- Stores member information for each mess
-- ============================================
CREATE TABLE members (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT REFERENCES mess(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  is_manager BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_members_mess_id ON members(mess_id);
CREATE INDEX idx_members_is_manager ON members(is_manager);

-- ============================================
-- TABLE: meals
-- Stores daily meal logs for members
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
  UNIQUE(member_id, meal_date) -- One entry per member per day
);

-- Add indexes for faster queries
CREATE INDEX idx_meals_mess_id ON meals(mess_id);
CREATE INDEX idx_meals_member_id ON meals(member_id);
CREATE INDEX idx_meals_meal_date ON meals(meal_date);

-- ============================================
-- TABLE: expenses
-- Stores expense records for the mess
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

-- Add indexes for faster queries
CREATE INDEX idx_expenses_mess_id ON expenses(mess_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- ============================================
-- TABLE: menu_items
-- Stores daily menu items for meals
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

-- Add indexes for faster queries
CREATE INDEX idx_menu_items_mess_id ON menu_items(mess_id);
CREATE INDEX idx_menu_items_menu_date ON menu_items(menu_date);
CREATE INDEX idx_menu_items_meal_type ON menu_items(meal_type);

-- ============================================
-- TABLE: rules
-- Stores mess rules and regulations
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

-- Add index for faster queries
CREATE INDEX idx_rules_mess_id ON rules(mess_id);
CREATE INDEX idx_rules_is_active ON rules(is_active);

-- ============================================
-- TABLE: votes
-- Stores voting records for mess manager elections
-- ============================================
CREATE TABLE votes (
  id BIGSERIAL PRIMARY KEY,
  mess_id BIGINT REFERENCES mess(id) ON DELETE CASCADE,
  voter_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
  candidate_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
  voting_period VARCHAR(50) NOT NULL, -- Format: YYYY-MM (e.g., "2025-01")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voter_id, mess_id, voting_period) -- One vote per person per period
);

-- Add indexes for faster queries
CREATE INDEX idx_votes_mess_id ON votes(mess_id);
CREATE INDEX idx_votes_voting_period ON votes(voting_period);
CREATE INDEX idx_votes_candidate_id ON votes(candidate_id);

-- ============================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS: Auto-update updated_at on all tables
-- ============================================
CREATE TRIGGER update_mess_updated_at 
  BEFORE UPDATE ON mess
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at 
  BEFORE UPDATE ON members
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at 
  BEFORE UPDATE ON meals
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at 
  BEFORE UPDATE ON expenses
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at 
  BEFORE UPDATE ON menu_items
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at 
  BEFORE UPDATE ON rules
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at 
  BEFORE UPDATE ON votes
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS for all tables
-- ============================================
ALTER TABLE mess ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: Allow all operations for now
-- (You can customize these later for authentication)
-- ============================================
CREATE POLICY "Allow all operations on mess" 
  ON mess FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on members" 
  ON members FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on meals" 
  ON meals FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on expenses" 
  ON expenses FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on menu_items" 
  ON menu_items FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on rules" 
  ON rules FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on votes" 
  ON votes FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- VIEWS: Pre-built queries for common operations
-- ============================================

-- View: Monthly meal summary per member
CREATE OR REPLACE VIEW monthly_meal_summary AS
SELECT 
  m.id as member_id,
  m.name as member_name,
  m.mess_id,
  DATE_TRUNC('month', ml.meal_date)::date as month,
  COUNT(*) FILTER (WHERE ml.breakfast = true) as breakfast_count,
  COUNT(*) FILTER (WHERE ml.lunch = true) as lunch_count,
  COUNT(*) FILTER (WHERE ml.dinner = true) as dinner_count,
  (COUNT(*) FILTER (WHERE ml.breakfast = true) + 
   COUNT(*) FILTER (WHERE ml.lunch = true) + 
   COUNT(*) FILTER (WHERE ml.dinner = true)) as total_meals
FROM members m
LEFT JOIN meals ml ON m.id = ml.member_id
GROUP BY m.id, m.name, m.mess_id, DATE_TRUNC('month', ml.meal_date);

-- View: Monthly expense summary per member
CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT 
  m.id as member_id,
  m.name as member_name,
  m.mess_id,
  DATE_TRUNC('month', e.expense_date)::date as month,
  COALESCE(SUM(e.amount), 0) as total_paid,
  COUNT(e.id) as expense_count
FROM members m
LEFT JOIN expenses e ON m.id = e.paid_by
GROUP BY m.id, m.name, m.mess_id, DATE_TRUNC('month', e.expense_date);

-- View: Meal rate calculation per mess per month
CREATE OR REPLACE VIEW monthly_meal_rate AS
WITH meal_counts AS (
  SELECT 
    mess_id,
    DATE_TRUNC('month', meal_date)::date as month,
    SUM(CASE WHEN breakfast THEN 1 ELSE 0 END +
        CASE WHEN lunch THEN 1 ELSE 0 END +
        CASE WHEN dinner THEN 1 ELSE 0 END) as total_meals
  FROM meals
  GROUP BY mess_id, DATE_TRUNC('month', meal_date)
),
expense_totals AS (
  SELECT 
    mess_id,
    DATE_TRUNC('month', expense_date)::date as month,
    COALESCE(SUM(amount), 0) as total_expenses
  FROM expenses
  GROUP BY mess_id, DATE_TRUNC('month', expense_date)
)
SELECT 
  COALESCE(mc.mess_id, et.mess_id) as mess_id,
  COALESCE(mc.month, et.month) as month,
  COALESCE(mc.total_meals, 0) as total_meals,
  COALESCE(et.total_expenses, 0) as total_expenses,
  CASE 
    WHEN COALESCE(mc.total_meals, 0) > 0 
    THEN COALESCE(et.total_expenses, 0) / mc.total_meals
    ELSE 0 
  END as meal_rate
FROM meal_counts mc
FULL OUTER JOIN expense_totals et 
  ON mc.mess_id = et.mess_id 
  AND mc.month = et.month;

-- ============================================
-- FUNCTIONS: Helper functions for calculations
-- ============================================

-- Function: Get member balance for a specific month
CREATE OR REPLACE FUNCTION get_member_balance(
  p_member_id BIGINT,
  p_month DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  member_id BIGINT,
  member_name VARCHAR,
  total_meals BIGINT,
  total_paid DECIMAL,
  meal_rate DECIMAL,
  share_amount DECIMAL,
  balance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    COALESCE(ms.total_meals, 0),
    COALESCE(es.total_paid, 0),
    COALESCE(mr.meal_rate, 0),
    COALESCE(ms.total_meals, 0) * COALESCE(mr.meal_rate, 0),
    COALESCE(es.total_paid, 0) - (COALESCE(ms.total_meals, 0) * COALESCE(mr.meal_rate, 0))
  FROM members m
  LEFT JOIN monthly_meal_summary ms 
    ON m.id = ms.member_id 
    AND ms.month = DATE_TRUNC('month', p_month)::date
  LEFT JOIN monthly_expense_summary es 
    ON m.id = es.member_id 
    AND es.month = DATE_TRUNC('month', p_month)::date
  LEFT JOIN monthly_meal_rate mr 
    ON m.mess_id = mr.mess_id 
    AND mr.month = DATE_TRUNC('month', p_month)::date
  WHERE m.id = p_member_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get all balances for a mess
CREATE OR REPLACE FUNCTION get_mess_balances(
  p_mess_id BIGINT,
  p_month DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  member_id BIGINT,
  member_name VARCHAR,
  total_meals BIGINT,
  total_paid DECIMAL,
  meal_rate DECIMAL,
  share_amount DECIMAL,
  balance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    COALESCE(ms.total_meals, 0),
    COALESCE(es.total_paid, 0),
    COALESCE(mr.meal_rate, 0),
    COALESCE(ms.total_meals, 0) * COALESCE(mr.meal_rate, 0),
    COALESCE(es.total_paid, 0) - (COALESCE(ms.total_meals, 0) * COALESCE(mr.meal_rate, 0))
  FROM members m
  LEFT JOIN monthly_meal_summary ms 
    ON m.id = ms.member_id 
    AND ms.month = DATE_TRUNC('month', p_month)::date
  LEFT JOIN monthly_expense_summary es 
    ON m.id = es.member_id 
    AND es.month = DATE_TRUNC('month', p_month)::date
  LEFT JOIN monthly_meal_rate mr 
    ON m.mess_id = mr.mess_id 
    AND mr.month = DATE_TRUNC('month', p_month)::date
  WHERE m.mess_id = p_mess_id
  ORDER BY m.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- Uncomment to insert sample data
-- ============================================
/*
-- Insert sample mess
INSERT INTO mess (name) VALUES ('Bachelor Mess - Dhaka');

-- Get the mess_id (should be 1 if this is the first insert)
-- Insert sample members
INSERT INTO members (mess_id, name, email, phone, is_manager) VALUES
(1, 'রাহুল আহমেদ', 'rahul@example.com', '01711111111', true),
(1, 'করিম খান', 'karim@example.com', '01722222222', false),
(1, 'সাকিব হাসান', 'sakib@example.com', '01733333333', false);

-- Insert sample meals for current date
INSERT INTO meals (mess_id, member_id, meal_date, breakfast, lunch, dinner) VALUES
(1, 1, CURRENT_DATE, true, true, true),
(1, 2, CURRENT_DATE, true, false, true),
(1, 3, CURRENT_DATE, false, true, true);

-- Insert sample expenses
INSERT INTO expenses (mess_id, paid_by, description, amount, category) VALUES
(1, 1, 'চাল ও ডাল', 2500.00, 'groceries'),
(1, 2, 'বিদ্যুৎ বিল', 800.00, 'utilities'),
(1, 1, 'সবজি ও মাছ', 1500.00, 'groceries'),
(1, 3, 'রান্নার গ্যাস', 600.00, 'utilities');

-- Insert sample menu items
INSERT INTO menu_items (mess_id, dish, meal_type, menu_date) VALUES
(1, 'পরোটা ও ডিম', 'breakfast', CURRENT_DATE),
(1, 'ভাত, ডাল, মাছ', 'lunch', CURRENT_DATE),
(1, 'ভাত, সবজি, মুরগি', 'dinner', CURRENT_DATE);

-- Insert sample rules
INSERT INTO rules (mess_id, title, description) VALUES
(1, 'পরিচ্ছন্নতা', 'প্রতিদিন রান্নাঘর পরিষ্কার রাখতে হবে'),
(1, 'খাবার সময়', 'খাবার ৩-৫ ঘণ্টা আগে অফ করতে হবে'),
(1, 'টাকা পরিশোধ', 'প্রতি মাসের ৫ তারিখের মধ্যে বিল পরিশোধ করতে হবে');
*/

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify everything is working
-- ============================================

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check all indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check all views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check all functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '✅ 7 tables created: mess, members, meals, expenses, menu_items, rules, votes';
  RAISE NOTICE '✅ All indexes and triggers created';
  RAISE NOTICE '✅ Row Level Security enabled';
  RAISE NOTICE '✅ Views and functions created';
  RAISE NOTICE '🚀 Your database is ready to use!';
END $$;
