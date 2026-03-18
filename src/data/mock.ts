import type { Client, Contract, UserActivityRow, HierarchyNode, HealthSnapshot, SupportMetric, DeviceStatusRow } from '../types';

const REGIONS = ['APAC', 'EMEA', 'AMER', 'LATAM'];
const COUNTRIES: Record<string, string[]> = {
  APAC: ['Australia', 'Japan', 'Singapore', 'India'],
  EMEA: ['UK', 'Germany', 'France', 'Netherlands'],
  AMER: ['USA', 'Canada'],
  LATAM: ['Brazil', 'Mexico', 'Colombia'],
};
const BUSINESS_UNITS = ['Operations', 'Safety', 'Logistics', 'HR', 'Field Services'];
const CSM_OWNERS = [
  { id: 'csm-001', name: 'Sarah Chen' },
  { id: 'csm-002', name: 'James Miller' },
  { id: 'csm-003', name: 'Priya Sharma' },
  { id: 'csm-004', name: 'Tom Rodriguez' },
];
const TIERS: Client['tier'][] = ['Enterprise', 'Mid-Market', 'SMB'];

// Generate 80 clients
export const clients: Client[] = [];
const clientNames = [
  'Acme Corp','GlobalTech','SafeWork Inc','BuildSmart','CargoLine','MineRight',
  'FieldForce','SiteSecure','WorkSafe Ltd','HazardPro','ProtectAll','ShieldCo',
  'GuardianTech','SafeOps','RiskMgmt','ComplianceFirst','SecureField','SafeRoute',
  'WorkGuard','SafetyFirst','ProShield','FieldSafe','SecurePath','SafetyNet',
  'GuardCo','SafeMinds','RiskFree','CompliancePro','SecureSite','SafeFleet',
  'WorkSmart','SafeLogix','RiskPro','ShieldForce','SafetyLink','ComplianceHub',
  'SecureWork','SafeGround','WorkShield','SafetyCore','RiskShield','GuardForce',
  'SafetyPro','WorkSafe Co','ProtectCo','SafetyOne','RiskOne','CompOne',
  'SecureOne','SafeOne','GuardOne','FieldOne','SiteOne','WorkOne',
  'HazOne','SafelyGo','SafeNow','RiskNow','CompNow','SecNow',
  'GuardNow','FieldNow','SiteNow','WorkNow','SafetyNow','RiskForce',
  'CompForce','SecForce','GuardField','SafeField','RiskField','CompField',
  'SecField','WorkField','SafetyGroup','RiskGroup','CompGroup','SecGroup',
  'GuardGroup','FieldGroup','SiteGroup','WorkGroup',
];

for (let i = 0; i < 80; i++) {
  const region = REGIONS[i % 4];
  const csm = CSM_OWNERS[i % 4];
  clients.push({
    client_id: `CLT-${String(i + 1).padStart(3, '0')}`,
    client_name: clientNames[i] || `Client ${i + 1}`,
    region,
    country: COUNTRIES[region][i % COUNTRIES[region].length],
    business_unit: BUSINESS_UNITS[i % 5],
    csm_owner: csm.name,
    csm_owner_id: csm.id,
    tier: TIERS[i % 3],
    onboarding_date: `202${3 + (i % 3)}-0${(i % 9) + 1}-01`,
    contract_start: `202${3 + (i % 3)}-0${(i % 9) + 1}-01`,
  });
}

// Generate contracts
export const contracts: Contract[] = clients.map((c, i) => {
  const arrValues = [120000, 240000, 60000, 480000, 96000, 360000, 180000, 72000];
  const arr = arrValues[i % 8];
  const daysToRenewal = (i * 37) % 400 - 50; // -50 to 349
  const invoiceStatuses: Contract['invoice_status'][] = ['Paid', 'Paid', 'Paid', 'Pending', 'Overdue'];
  return {
    contract_id: `CON-${String(i + 1).padStart(3, '0')}`,
    client_id: c.client_id,
    arr,
    mrr: arr / 12,
    billing_cycle: i % 3 === 0 ? 'Monthly' : i % 3 === 1 ? 'Annual' : 'Half-yearly',
    invoice_status: invoiceStatuses[i % 5],
    last_invoice_date: '2026-02-01',
    next_invoice_date: '2026-03-01',
    renewal_date: new Date(Date.now() + daysToRenewal * 86400000).toISOString().split('T')[0],
    days_to_renewal: daysToRenewal,
    payment_risk_flag: i % 5 === 4 || daysToRenewal < 0,
    open_support_tickets: i % 7,
  };
});

// Generate monthly user activity (13 months: Mar 2025 - Mar 2026)
export const userActivity: UserActivityRow[] = [];
const months: string[] = [];
for (let m = 0; m < 13; m++) {
  const d = new Date(2025, 2 + m, 1);
  months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
}

for (const client of clients) {
  const idx = clients.indexOf(client);
  const baseLicensed = [50, 100, 200, 500, 1000, 75, 150, 300][idx % 8];
  for (let mi = 0; mi < 13; mi++) {
    const trend = idx % 4 === 3 ? -0.01 * mi : 0.005 * mi; // some declining
    const activePct = Math.min(0.95, Math.max(0.2, (0.55 + (idx % 10) * 0.04 + trend)));
    const active = Math.round(baseLicensed * activePct);
    const activated = Math.round(baseLicensed * Math.min(1, activePct + 0.1));
    userActivity.push({
      id: `UA-${client.client_id}-${months[mi]}`,
      client_id: client.client_id,
      month: months[mi],
      licensed_users: baseLicensed,
      activated_users: activated,
      active_users: active,
      no_data_users: Math.round(baseLicensed * (0.05 + (idx % 5) * 0.02)),
      stale_device_users: Math.round(baseLicensed * (0.08 + (idx % 4) * 0.03)),
      permission_off_users: Math.round(baseLicensed * (0.04 + (idx % 3) * 0.03)),
      sessions_per_active_user: parseFloat((3.5 + (idx % 5) * 0.5 - trend * 5).toFixed(1)),
      feature_adoption_pct: parseFloat((0.45 + (idx % 8) * 0.05 + trend * 2).toFixed(2)),
      dau: Math.round(active * 0.15),
      mau: active,
    });
  }
}

// Hierarchy nodes
export const hierarchyNodes: HierarchyNode[] = [];
for (const client of clients) {
  const idx = clients.indexOf(client);
  const clientActivity = userActivity.filter(u => u.client_id === client.client_id && u.month === '2026-03');
  const latestActivity = clientActivity[0];
  if (!latestActivity) continue;
  const divisions = ['North', 'South', 'Central'];
  const levels = ['Frontline', 'Supervisor', 'Manager'];
  for (let d = 0; d < 3; d++) {
    for (let l = 0; l < 3; l++) {
      const base = Math.round(latestActivity.licensed_users / 9);
      const activePct = 0.4 + (d * 0.15) + (l * 0.05) - (idx % 4 === 3 ? 0.1 : 0);
      hierarchyNodes.push({
        node_id: `NODE-${client.client_id}-${d}-${l}`,
        client_id: client.client_id,
        region: client.region,
        division: divisions[d],
        hierarchy_level: levels[l],
        licensed_users: base,
        active_users: Math.round(base * activePct),
      });
    }
  }
}

// Health snapshots
export const healthSnapshots: HealthSnapshot[] = [];
for (const client of clients) {
  const idx = clients.indexOf(client);
  for (let mi = 0; mi < 13; mi++) {
    const act = userActivity.find(u => u.client_id === client.client_id && u.month === months[mi]);
    if (!act) continue;
    const activePct = act.active_users / act.licensed_users;
    const featurePct = act.feature_adoption_pct;
    const usageFreq = Math.min(1, act.sessions_per_active_user / 7);
    const engagement = Math.min(1, act.sessions_per_active_user / 5);
    const mrrShare = 0.7 + (idx % 5) * 0.05;
    const support = 1 - (0.1 * (idx % 4));
    const billing = contracts[idx]?.invoice_status === 'Paid' ? 1 : contracts[idx]?.invoice_status === 'Pending' ? 0.7 : 0.4;

    const rawScore =
      activePct * 25 +
      featurePct * 20 +
      usageFreq * 15 +
      engagement * 15 +
      mrrShare * 10 +
      support * 10 +
      billing * 5;

    const spreadRatio = Math.min(1, act.active_users / (act.licensed_users || 1));
    const spreadScore = (1 - spreadRatio) * 100;
    const attachRate = featurePct * 50 + usageFreq * 30 + spreadScore * 0.2;

    healthSnapshots.push({
      id: `HS-${client.client_id}-${months[mi]}`,
      client_id: client.client_id,
      month: months[mi],
      health_score: Math.round(Math.min(100, Math.max(0, rawScore))),
      attach_rate: Math.round(Math.min(100, attachRate)),
      active_pct: parseFloat((activePct * 100).toFixed(1)),
      feature_adoption_pct: parseFloat((featurePct * 100).toFixed(1)),
      usage_frequency_score: parseFloat((usageFreq * 100).toFixed(1)),
      engagement_score: parseFloat((engagement * 100).toFixed(1)),
      mrr_share: parseFloat((mrrShare * 100).toFixed(1)),
      support_score: parseFloat((support * 100).toFixed(1)),
      billing_score: parseFloat((billing * 100).toFixed(1)),
    });
  }
}

// Support metrics
export const supportMetrics: SupportMetric[] = clients.map((c, i) => ({
  id: `SM-${c.client_id}`,
  client_id: c.client_id,
  month: '2026-03',
  tickets_open: i % 7,
  tickets_resolved: (i % 5) + 2,
  avg_resolution_hours: 12 + (i % 8) * 6,
  escalation_count: i % 11 === 0 ? 1 : 0,
}));

// Device status rows (user-level)
export const deviceStatusRows: DeviceStatusRow[] = [];
for (const client of clients) {
  const idx = clients.indexOf(client);
  const act = userActivity.find(u => u.client_id === client.client_id && u.month === '2026-03');
  if (!act) continue;
  const userCount = Math.min(act.licensed_users, 20); // cap at 20 users per client for mock
  for (let u = 0; u < userCount; u++) {
    const isInactive = u >= act.active_users * (20 / act.licensed_users);
    const isStale = u < act.stale_device_users * (20 / act.licensed_users);
    const isPermOff = u < act.permission_off_users * (20 / act.licensed_users);
    const isNoData = u < act.no_data_users * (20 / act.licensed_users);
    const daysInactive = isInactive ? 30 + (u * 3) : Math.floor(Math.random() * 5);
    deviceStatusRows.push({
      user_id: `USR-${client.client_id}-${String(u + 1).padStart(3, '0')}`,
      client_id: client.client_id,
      user_name: `User ${u + 1} (${client.client_name})`,
      region: client.region,
      device_model: ['iPhone 14', 'Samsung S23', 'Pixel 7', 'iPhone 13'][u % 4],
      app_version: ['3.2.1', '3.2.0', '3.1.5', '3.0.8'][u % 4],
      last_sync_date: new Date(Date.now() - (isStale ? (14 + u) : u) * 86400000).toISOString().split('T')[0],
      days_since_sync: isStale ? 14 + u : u,
      permissions_ok: !isPermOff,
      permission_type_disabled: isPermOff ? ['Location', 'Notification', 'Camera'][u % 3] : null,
      permission_disabled_date: isPermOff ? '2026-02-15' : null,
      activated_date: isNoData ? '2026-01-10' : '2025-08-01',
      total_events: isNoData ? 0 : (isInactive ? 0 : 50 + u * 10),
      last_activity_date: isInactive ? new Date(Date.now() - daysInactive * 86400000).toISOString().split('T')[0] : new Date(Date.now() - u * 86400000).toISOString().split('T')[0],
      days_inactive: isInactive ? daysInactive : null,
      hierarchy_level: ['Frontline', 'Supervisor', 'Manager'][u % 3],
    });
  }
  void idx; // suppress unused warning
}
