-- Relational family tree: people + unions + junction tables.
-- Run in Supabase SQL Editor if not using CLI migrations.

CREATE TABLE IF NOT EXISTS people (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  label text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS union_spouses (
  union_id text NOT NULL REFERENCES unions (id) ON DELETE CASCADE,
  person_id text NOT NULL REFERENCES people (id) ON DELETE CASCADE,
  PRIMARY KEY (union_id, person_id)
);

CREATE TABLE IF NOT EXISTS union_children (
  union_id text NOT NULL REFERENCES unions (id) ON DELETE CASCADE,
  child_person_id text NOT NULL REFERENCES people (id) ON DELETE CASCADE,
  PRIMARY KEY (union_id, child_person_id),
  CONSTRAINT union_children_one_birth_union UNIQUE (child_person_id)
);

CREATE INDEX IF NOT EXISTS idx_people_user ON people (user_id);
CREATE INDEX IF NOT EXISTS idx_unions_user ON unions (user_id);

ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE unions ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_spouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "people_select_own" ON people FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "people_insert_own" ON people FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "people_update_own" ON people FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "people_delete_own" ON people FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "unions_select_own" ON unions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "unions_insert_own" ON unions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "unions_update_own" ON unions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "unions_delete_own" ON unions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "union_spouses_select" ON union_spouses FOR SELECT USING (
  EXISTS (SELECT 1 FROM unions u WHERE u.id = union_spouses.union_id AND u.user_id = auth.uid())
);
CREATE POLICY "union_spouses_insert" ON union_spouses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM unions u WHERE u.id = union_spouses.union_id AND u.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM people p WHERE p.id = union_spouses.person_id AND p.user_id = auth.uid())
);
CREATE POLICY "union_spouses_delete" ON union_spouses FOR DELETE USING (
  EXISTS (SELECT 1 FROM unions u WHERE u.id = union_spouses.union_id AND u.user_id = auth.uid())
);

CREATE POLICY "union_children_select" ON union_children FOR SELECT USING (
  EXISTS (SELECT 1 FROM unions u WHERE u.id = union_children.union_id AND u.user_id = auth.uid())
);
CREATE POLICY "union_children_insert" ON union_children FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM unions u WHERE u.id = union_children.union_id AND u.user_id = auth.uid())
  AND EXISTS (
    SELECT 1
    FROM people p
    WHERE p.id = union_children.child_person_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "union_children_delete" ON union_children FOR DELETE USING (
  EXISTS (SELECT 1 FROM unions u WHERE u.id = union_children.union_id AND u.user_id = auth.uid())
);
