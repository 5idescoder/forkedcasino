/*
  # Add admin features

  1. New Tables
    - `game_settings`
      - `id` (uuid, primary key)
      - `game` (text)
      - `settings` (jsonb)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, foreign key)

    - `admin_logs`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key)
      - `action` (text)
      - `details` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Add admin-specific RLS policies
    - Add admin check functions
*/

-- Create game_settings table
CREATE TABLE IF NOT EXISTS game_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES users(id),
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for game_settings
CREATE POLICY "Admins can manage game settings"
  ON game_settings
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin policies for admin_logs
CREATE POLICY "Admins can view logs"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create logs"
  ON admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admin policies for users table
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_settings_game ON game_settings(game);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);