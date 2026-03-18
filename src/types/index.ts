export interface Client {
  client_id: string;
  client_name: string;
  region: string;
  country: string;
  business_unit: string;
  csm_owner: string;
  csm_owner_id: string;
  tier: 'Enterprise' | 'Mid-Market' | 'SMB';
  onboarding_date: string;
  contract_start: string;
}

export interface Contract {
  contract_id: string;
  client_id: string;
  arr: number;
  mrr: number;
  billing_cycle: 'Monthly' | 'Half-yearly' | 'Annual';
  invoice_status: 'Paid' | 'Pending' | 'Overdue';
  last_invoice_date: string;
  next_invoice_date: string;
  renewal_date: string;
  days_to_renewal: number;
  payment_risk_flag: boolean;
  open_support_tickets: number;
}

export interface UserActivityRow {
  id: string;
  client_id: string;
  month: string;
  licensed_users: number;
  activated_users: number;
  active_users: number;
  no_data_users: number;
  stale_device_users: number;
  permission_off_users: number;
  sessions_per_active_user: number;
  feature_adoption_pct: number;
  dau: number;
  mau: number;
}

export interface HierarchyNode {
  node_id: string;
  client_id: string;
  region: string;
  division: string;
  hierarchy_level: string;
  licensed_users: number;
  active_users: number;
}

export interface HealthSnapshot {
  id: string;
  client_id: string;
  month: string;
  health_score: number;
  attach_rate: number;
  active_pct: number;
  feature_adoption_pct: number;
  usage_frequency_score: number;
  engagement_score: number;
  mrr_share: number;
  support_score: number;
  billing_score: number;
}

export interface SupportMetric {
  id: string;
  client_id: string;
  month: string;
  tickets_open: number;
  tickets_resolved: number;
  avg_resolution_hours: number;
  escalation_count: number;
}

export interface DeviceStatusRow {
  user_id: string;
  client_id: string;
  user_name: string;
  region: string;
  device_model: string;
  app_version: string;
  last_sync_date: string;
  days_since_sync: number;
  permissions_ok: boolean;
  permission_type_disabled: string | null;
  permission_disabled_date: string | null;
  activated_date: string;
  total_events: number;
  last_activity_date: string | null;
  days_inactive: number | null;
  hierarchy_level: string;
}

export interface GlobalFilters {
  dateRange: { start: string; end: string };
  clients: string[];
  regions: string[];
  countries: string[];
  csmOwner: string;
  businessUnits: string[];
  selectedClientId: string;
}

export type UserRole = 'csm' | 'cs_leadership' | 'operations';

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  csm_owner_id: string;
}
