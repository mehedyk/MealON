-- ============================================================
-- MEALON v2 — DATABASE SCHEMA
-- Chunk 1: Core tables + RLS + auth setup
-- 
-- INSTRUCTIONS:
--   1. Open your Supabase project → SQL Editor
--   2. Paste this ENTIRE file and Run it
--   3. It is idempotent — safe to re-run
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- for gen_random_bytes

-- ============================================================
-- TABLES
-- ============================================================

-- ── mess ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mess (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL CHECK (char_length(trim(name)) >= 2),
  mess_code   CHAR(6)      NOT NULL UNIQUE,
  created_by  UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── members ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mess_id      BIGINT       NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  name         VARCHAR(80)  NOT NULL CHECK (char_length(trim(name)) >= 2),
  email        VARCHAR(254) NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone        VARCHAR(20),
  role         VARCHAR(20)  NOT NULL DEFAULT 'member'
                            CHECK (role IN ('manager', 'member')),
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  joined_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mess_id)
);

-- ── meals ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meals (
  id          BIGSERIAL PRIMARY KEY,
  mess_id     BIGINT   NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  member_id   BIGINT   NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  meal_date   DATE     NOT NULL CHECK (meal_date <= CURRENT_DATE + INTERVAL '1 day'),
  breakfast   BOOLEAN  NOT NULL DEFAULT FALSE,
  lunch       BOOLEAN  NOT NULL DEFAULT FALSE,
  dinner      BOOLEAN  NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, meal_date)
);

-- ── expenses ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id            BIGSERIAL PRIMARY KEY,
  mess_id       BIGINT          NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  paid_by       BIGINT          NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  description   VARCHAR(300)    NOT NULL CHECK (char_length(trim(description)) >= 2),
  amount        NUMERIC(10, 2)  NOT NULL CHECK (amount > 0 AND amount <= 9999999),
  category      VARCHAR(50)     NOT NULL
                                CHECK (category IN ('grocery','utility','maintenance','cook','other')),
  expense_date  DATE            NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ── menu_items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id          BIGSERIAL PRIMARY KEY,
  mess_id     BIGINT       NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  dish        VARCHAR(120) NOT NULL CHECK (char_length(trim(dish)) >= 1),
  meal_type   VARCHAR(20)  NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner')),
  menu_date   DATE         NOT NULL,
  created_by  BIGINT       NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── rules ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rules (
  id          BIGSERIAL PRIMARY KEY,
  mess_id     BIGINT       NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  title       VARCHAR(120) NOT NULL CHECK (char_length(trim(title)) >= 2),
  description TEXT         NOT NULL CHECK (char_length(trim(description)) >= 2),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_by  BIGINT       NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── deposits ─────────────────────────────────────────────────
-- Tracks money each member has deposited into the mess fund.
CREATE TABLE IF NOT EXISTS deposits (
  id            BIGSERIAL PRIMARY KEY,
  mess_id       BIGINT         NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  member_id     BIGINT         NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2)  NOT NULL CHECK (amount > 0 AND amount <= 9999999),
  note          VARCHAR(200),
  deposit_date  DATE           NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── votes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id             BIGSERIAL PRIMARY KEY,
  mess_id        BIGINT      NOT NULL REFERENCES mess(id) ON DELETE CASCADE,
  voter_id       BIGINT      NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  candidate_id   BIGINT      NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  voting_period  VARCHAR(7)  NOT NULL,   -- YYYY-MM
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(voter_id, mess_id, voting_period),
  CHECK (voter_id <> candidate_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_members_user_id   ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_mess_id   ON members(mess_id);
CREATE INDEX IF NOT EXISTS idx_meals_mess_date   ON meals(mess_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_expenses_mess_id  ON expenses(mess_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_deposits_mess_id  ON deposits(mess_id);
CREATE INDEX IF NOT EXISTS idx_votes_mess_period ON votes(mess_id, voting_period);

-- ── Auto-update updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_mess_updated_at
    BEFORE UPDATE ON mess FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_members_updated_at
    BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_meals_updated_at
    BEFORE UPDATE ON meals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE mess        ENABLE ROW LEVEL SECURITY;
ALTER TABLE members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes       ENABLE ROW LEVEL SECURITY;

-- Helper: is the calling user an active member of this mess?
CREATE OR REPLACE FUNCTION is_mess_member(p_mess_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
      AND mess_id = p_mess_id
      AND is_active = TRUE
  );
$$;

-- Helper: is the calling user the manager of this mess?
CREATE OR REPLACE FUNCTION is_mess_manager(p_mess_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
      AND mess_id = p_mess_id
      AND role = 'manager'
      AND is_active = TRUE
  );
$$;

-- ── mess policies ──────────────────────────────────────────────
DROP POLICY IF EXISTS mess_select ON mess;
CREATE POLICY mess_select ON mess
  FOR SELECT TO authenticated
  USING (is_mess_member(id));

DROP POLICY IF EXISTS mess_insert ON mess;
CREATE POLICY mess_insert ON mess
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS mess_update ON mess;
CREATE POLICY mess_update ON mess
  FOR UPDATE TO authenticated
  USING (is_mess_manager(id))
  WITH CHECK (is_mess_manager(id));

DROP POLICY IF EXISTS mess_delete ON mess;
CREATE POLICY mess_delete ON mess
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- ── members policies ──────────────────────────────────────────
DROP POLICY IF EXISTS members_select ON members;
CREATE POLICY members_select ON members
  FOR SELECT TO authenticated
  USING (is_mess_member(mess_id));

DROP POLICY IF EXISTS members_insert ON members;
CREATE POLICY members_insert ON members
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Can insert yourself
    user_id = auth.uid()
    OR
    -- OR a manager inserts someone else
    is_mess_manager(mess_id)
  );

DROP POLICY IF EXISTS members_update ON members;
CREATE POLICY members_update ON members
  FOR UPDATE TO authenticated
  USING (
    -- Own record OR manager
    user_id = auth.uid() OR is_mess_manager(mess_id)
  )
  WITH CHECK (
    user_id = auth.uid() OR is_mess_manager(mess_id)
  );

DROP POLICY IF EXISTS members_delete ON members;
CREATE POLICY members_delete ON members
  FOR DELETE TO authenticated
  USING (is_mess_manager(mess_id));

-- ── meals policies ────────────────────────────────────────────
DROP POLICY IF EXISTS meals_select ON meals;
CREATE POLICY meals_select ON meals
  FOR SELECT TO authenticated
  USING (is_mess_member(mess_id));

DROP POLICY IF EXISTS meals_insert ON meals;
CREATE POLICY meals_insert ON meals
  FOR INSERT TO authenticated
  WITH CHECK (
    is_mess_member(mess_id)
    AND EXISTS (
      SELECT 1 FROM members
      WHERE id = member_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS meals_update ON meals;
CREATE POLICY meals_update ON meals
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = member_id AND user_id = auth.uid()
    )
    OR is_mess_manager(mess_id)
  );

DROP POLICY IF EXISTS meals_delete ON meals;
CREATE POLICY meals_delete ON meals
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = member_id AND user_id = auth.uid()
    )
    OR is_mess_manager(mess_id)
  );

-- ── expenses policies ─────────────────────────────────────────
DROP POLICY IF EXISTS expenses_select ON expenses;
CREATE POLICY expenses_select ON expenses
  FOR SELECT TO authenticated
  USING (is_mess_member(mess_id));

DROP POLICY IF EXISTS expenses_insert ON expenses;
CREATE POLICY expenses_insert ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (is_mess_member(mess_id));

DROP POLICY IF EXISTS expenses_update ON expenses;
CREATE POLICY expenses_update ON expenses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM members WHERE id = paid_by AND user_id = auth.uid())
    OR is_mess_manager(mess_id)
  );

DROP POLICY IF EXISTS expenses_delete ON expenses;
CREATE POLICY expenses_delete ON expenses
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM members WHERE id = paid_by AND user_id = auth.uid())
    OR is_mess_manager(mess_id)
  );

-- ── menu_items policies ───────────────────────────────────────
DROP POLICY IF EXISTS menu_items_select ON menu_items;
CREATE POLICY menu_items_select ON menu_items
  FOR SELECT TO authenticated USING (is_mess_member(mess_id));

DROP POLICY IF EXISTS menu_items_insert ON menu_items;
CREATE POLICY menu_items_insert ON menu_items
  FOR INSERT TO authenticated WITH CHECK (is_mess_member(mess_id));

DROP POLICY IF EXISTS menu_items_delete ON menu_items;
CREATE POLICY menu_items_delete ON menu_items
  FOR DELETE TO authenticated
  USING (is_mess_manager(mess_id));

-- ── rules policies ────────────────────────────────────────────
DROP POLICY IF EXISTS rules_select ON rules;
CREATE POLICY rules_select ON rules
  FOR SELECT TO authenticated USING (is_mess_member(mess_id));

DROP POLICY IF EXISTS rules_insert ON rules;
CREATE POLICY rules_insert ON rules
  FOR INSERT TO authenticated WITH CHECK (is_mess_manager(mess_id));

DROP POLICY IF EXISTS rules_update ON rules;
CREATE POLICY rules_update ON rules
  FOR UPDATE TO authenticated
  USING (is_mess_manager(mess_id)) WITH CHECK (is_mess_manager(mess_id));

DROP POLICY IF EXISTS rules_delete ON rules;
CREATE POLICY rules_delete ON rules
  FOR DELETE TO authenticated USING (is_mess_manager(mess_id));

-- ── deposits policies ─────────────────────────────────────────
DROP POLICY IF EXISTS deposits_select ON deposits;
CREATE POLICY deposits_select ON deposits
  FOR SELECT TO authenticated USING (is_mess_member(mess_id));

DROP POLICY IF EXISTS deposits_insert ON deposits;
CREATE POLICY deposits_insert ON deposits
  FOR INSERT TO authenticated WITH CHECK (is_mess_manager(mess_id));

DROP POLICY IF EXISTS deposits_delete ON deposits;
CREATE POLICY deposits_delete ON deposits
  FOR DELETE TO authenticated USING (is_mess_manager(mess_id));

-- ── votes policies ────────────────────────────────────────────
DROP POLICY IF EXISTS votes_select ON votes;
CREATE POLICY votes_select ON votes
  FOR SELECT TO authenticated USING (is_mess_member(mess_id));

DROP POLICY IF EXISTS votes_insert ON votes;
CREATE POLICY votes_insert ON votes
  FOR INSERT TO authenticated
  WITH CHECK (
    is_mess_member(mess_id)
    AND EXISTS (SELECT 1 FROM members WHERE id = voter_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS votes_delete ON votes;
CREATE POLICY votes_delete ON votes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM members WHERE id = voter_id AND user_id = auth.uid()));

-- ============================================================
-- STORED PROCEDURES (secure, SECURITY DEFINER)
-- ============================================================

-- ── create_mess : atomically creates mess + adds creator as manager ──
CREATE OR REPLACE FUNCTION create_mess(
  p_mess_name  TEXT,
  p_user_id    UUID,
  p_name       TEXT,
  p_email      TEXT,
  p_phone      TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mess_id   BIGINT;
  v_member_id BIGINT;
  v_code      CHAR(6);
  v_attempts  INT := 0;
BEGIN
  -- Input validation (server-side, belt-and-suspenders)
  IF trim(p_mess_name) = '' OR p_mess_name IS NULL THEN
    RAISE EXCEPTION 'VALIDATION: Mess name is required';
  END IF;
  IF length(trim(p_mess_name)) < 2 THEN
    RAISE EXCEPTION 'VALIDATION: Mess name must be at least 2 characters';
  END IF;
  IF length(trim(p_mess_name)) > 80 THEN
    RAISE EXCEPTION 'VALIDATION: Mess name is too long';
  END IF;
  IF trim(p_name) = '' OR p_name IS NULL THEN
    RAISE EXCEPTION 'VALIDATION: Your name is required';
  END IF;
  IF p_email IS NULL OR p_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'VALIDATION: Valid email is required';
  END IF;
  -- Prevent a user creating multiple messes (one mess per user for now)
  IF EXISTS (SELECT 1 FROM members WHERE user_id = p_user_id AND is_active = TRUE) THEN
    RAISE EXCEPTION 'ALREADY_IN_MESS: You are already in a mess. Leave it first.';
  END IF;

  -- Generate a unique alphanumeric 6-char code
  LOOP
    v_code := upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM mess WHERE mess_code = v_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 20 THEN
      RAISE EXCEPTION 'Could not generate a unique mess code. Try again.';
    END IF;
  END LOOP;

  INSERT INTO mess (name, mess_code, created_by)
  VALUES (trim(p_mess_name), v_code, p_user_id)
  RETURNING id INTO v_mess_id;

  INSERT INTO members (user_id, mess_id, name, email, phone, role)
  VALUES (p_user_id, v_mess_id, trim(p_name), lower(trim(p_email)), trim(p_phone), 'manager')
  RETURNING id INTO v_member_id;

  RETURN json_build_object(
    'mess_id',    v_mess_id,
    'mess_code',  v_code,
    'member_id',  v_member_id
  );
END;
$$;

-- ── join_mess : join an existing mess by code ─────────────────
CREATE OR REPLACE FUNCTION join_mess(
  p_code     TEXT,
  p_user_id  UUID,
  p_name     TEXT,
  p_email    TEXT,
  p_phone    TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mess      mess%ROWTYPE;
  v_member_id BIGINT;
BEGIN
  -- Validation
  IF trim(p_code) = '' OR p_code IS NULL THEN
    RAISE EXCEPTION 'VALIDATION: Mess code is required';
  END IF;
  IF trim(p_name) = '' OR p_name IS NULL THEN
    RAISE EXCEPTION 'VALIDATION: Your name is required';
  END IF;

  -- Look up mess — case-insensitive
  SELECT * INTO v_mess FROM mess WHERE upper(trim(p_code)) = mess_code LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: No mess found with that code. Double-check it.';
  END IF;

  -- Already a member?
  IF EXISTS (
    SELECT 1 FROM members
    WHERE user_id = p_user_id AND mess_id = v_mess.id AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'ALREADY_MEMBER: You are already in this mess.';
  END IF;

  -- Already in ANY other mess?
  IF EXISTS (
    SELECT 1 FROM members WHERE user_id = p_user_id AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'ALREADY_IN_MESS: You are already in another mess. Leave it first.';
  END IF;

  INSERT INTO members (user_id, mess_id, name, email, phone, role)
  VALUES (p_user_id, v_mess.id, trim(p_name), lower(trim(p_email)), trim(p_phone), 'member')
  ON CONFLICT (user_id, mess_id) DO UPDATE
    SET is_active = TRUE, name = trim(p_name), updated_at = NOW()
  RETURNING id INTO v_member_id;

  RETURN json_build_object(
    'mess_id',    v_mess.id,
    'mess_name',  v_mess.name,
    'mess_code',  v_mess.mess_code,
    'member_id',  v_member_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_mess  TO authenticated;
GRANT EXECUTE ON FUNCTION join_mess    TO authenticated;
GRANT EXECUTE ON FUNCTION is_mess_member  TO authenticated;
GRANT EXECUTE ON FUNCTION is_mess_manager TO authenticated;

-- ============================================================
-- VERIFY (run this to confirm everything is set up)
-- ============================================================
SELECT
  t.tablename,
  CASE WHEN t.rowsecurity THEN '✅ RLS on' ELSE '❌ RLS OFF' END AS rls,
  COUNT(p.policyname) AS policies
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN ('mess','members','meals','expenses','menu_items','rules','deposits','votes')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
