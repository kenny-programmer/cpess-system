/*
  # Remove Class Funds Feature

  ## Changes
  1. Drop class_funds table - No longer needed as system focuses only on organization funds
  2. Remove related audit logs - Clean up any class_fund references
  
  ## Security
  - This is a safe operation as the feature was not yet in production use
  
  ## Important Notes
  - Organization funds remain fully functional
  - Transaction system unchanged
  - Audit logs for transactions preserved
*/

-- Drop class_funds table
DROP TABLE IF EXISTS class_funds CASCADE;

-- Update audit_logs check constraint to remove class_fund entity type
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_entity_type_check;

ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_entity_type_check 
  CHECK (entity_type IN ('transaction', 'user'));

-- Delete any existing class_fund audit logs
DELETE FROM audit_logs WHERE entity_type = 'class_fund';
