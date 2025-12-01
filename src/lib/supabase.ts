import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  role: 'admin' | 'officer' | 'member';
  officer_position: string | null;
  full_name: string;
  is_active: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  proof_image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClassFund = {
  id: string;
  section_name: string;
  title: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  proof_image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  action_type: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected';
  entity_type: 'transaction' | 'class_fund' | 'user';
  entity_id: string;
  user_id: string;
  changes: any;
  reason: string | null;
  created_at: string;
};

export type TransactionRevision = {
  id: string;
  transaction_id: string;
  title: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  proof_image_url: string;
  revised_by: string;
  revision_reason: string;
  created_at: string;
};
