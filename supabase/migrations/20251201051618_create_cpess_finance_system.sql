/*
  # CPESS Financial Transparency System - Initial Schema

  ## Overview
  This migration creates the complete database structure for the CPESS financial transparency system.
  
  ## New Tables
  
  ### 1. `users`
  Stores all user accounts (officers and read-only members)
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email address
  - `role` (text) - Either 'officer' or 'member'
  - `officer_position` (text, nullable) - Specific officer role if applicable
  - `full_name` (text) - User's full name
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### 2. `transactions`
  Main transaction records for organization funds
  - `id` (uuid, primary key) - Unique transaction identifier
  - `title` (text) - Transaction title
  - `amount` (decimal) - Transaction amount (positive for income, negative for expense)
  - `category` (text) - Transaction category
  - `description` (text) - Detailed description
  - `date` (date) - Transaction date
  - `proof_image_url` (text) - URL to uploaded proof image
  - `status` (text) - pending, approved, or rejected
  - `created_by` (uuid) - Reference to officer who created it
  - `approved_by` (uuid, nullable) - Reference to officer who approved/rejected
  - `approved_at` (timestamptz, nullable) - Approval timestamp
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 3. `class_funds`
  Separate class fund tracking per section
  - `id` (uuid, primary key) - Unique identifier
  - `section_name` (text) - Name of the section/class
  - `title` (text) - Transaction title
  - `amount` (decimal) - Transaction amount
  - `category` (text) - Transaction category
  - `description` (text) - Detailed description
  - `date` (date) - Transaction date
  - `proof_image_url` (text, nullable) - URL to uploaded proof image
  - `created_by` (uuid) - Reference to officer who created it
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 4. `audit_logs`
  Comprehensive audit trail for all actions
  - `id` (uuid, primary key) - Unique log identifier
  - `action_type` (text) - Type of action (created, updated, deleted, approved, rejected)
  - `entity_type` (text) - Type of entity (transaction, class_fund, user)
  - `entity_id` (uuid) - Reference to the affected entity
  - `user_id` (uuid) - User who performed the action
  - `changes` (jsonb) - JSON object containing before/after values
  - `reason` (text, nullable) - Reason for edit (required for updates)
  - `created_at` (timestamptz) - Action timestamp
  
  ### 5. `transaction_revisions`
  Complete revision history for transactions
  - `id` (uuid, primary key) - Unique revision identifier
  - `transaction_id` (uuid) - Reference to the transaction
  - `title` (text) - Transaction title at this revision
  - `amount` (decimal) - Amount at this revision
  - `category` (text) - Category at this revision
  - `description` (text) - Description at this revision
  - `date` (date) - Date at this revision
  - `proof_image_url` (text) - Proof URL at this revision
  - `revised_by` (uuid) - User who made this revision
  - `revision_reason` (text) - Reason for the revision
  - `created_at` (timestamptz) - Revision timestamp
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Read-only members can view all data
  - Officers have full CRUD permissions
  - Audit logs are append-only for all users
  
  ## Important Notes
  1. All monetary values use decimal type for precision
  2. Audit logs track every change with full history
  3. Transaction revisions preserve complete history
  4. RLS policies enforce role-based access control
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('officer', 'member')),
  officer_position text,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  amount decimal NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  proof_image_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by uuid NOT NULL REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create class_funds table
CREATE TABLE IF NOT EXISTS class_funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name text NOT NULL,
  title text NOT NULL,
  amount decimal NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  proof_image_url text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'approved', 'rejected')),
  entity_type text NOT NULL CHECK (entity_type IN ('transaction', 'class_fund', 'user')),
  entity_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id),
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Create transaction_revisions table
CREATE TABLE IF NOT EXISTS transaction_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount decimal NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  proof_image_url text NOT NULL,
  revised_by uuid NOT NULL REFERENCES users(id),
  revision_reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Anyone authenticated can view users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officers can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  );

CREATE POLICY "Officers can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  );

-- RLS Policies for transactions table
CREATE POLICY "Anyone authenticated can view transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officers can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  );

CREATE POLICY "Officers can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  );

CREATE POLICY "Officers can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  );

-- RLS Policies for class_funds table
CREATE POLICY "Anyone authenticated can view class funds"
  ON class_funds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officers can create class funds"
  ON class_funds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  );

CREATE POLICY "Officers can update class funds"
  ON class_funds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  );

CREATE POLICY "Officers can delete class funds"
  ON class_funds FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  );

-- RLS Policies for audit_logs table
CREATE POLICY "Anyone authenticated can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officers can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  );

-- RLS Policies for transaction_revisions table
CREATE POLICY "Anyone authenticated can view transaction revisions"
  ON transaction_revisions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officers can create transaction revisions"
  ON transaction_revisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_class_funds_section ON class_funds(section_name);
CREATE INDEX IF NOT EXISTS idx_class_funds_created_by ON class_funds(created_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_revisions_transaction ON transaction_revisions(transaction_id);
