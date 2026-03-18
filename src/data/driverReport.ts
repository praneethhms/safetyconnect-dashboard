import { clients } from './mock';

export interface DriverReport {
  id: string;
  client_id: string;
  month: string;
  employee_name: string;
  hierarchy: string;
  distance: number;
  avg_speed: number;
  max_speed: number;
  trips: number;
  ph_call: number;
  ph_screen: number;
  ph: number;
  ha: number;
  hb: number;
  hc: number;
  os: number;
  driving_score: number;
}

const NAMES = [
  'James Wilson', 'Maria Garcia', 'Robert Johnson', 'Linda Martinez', 'Michael Brown',
  'Patricia Davis', 'William Anderson', 'Barbara Taylor', 'David Thomas', 'Susan Jackson',
  'Richard White', 'Jessica Harris', 'Joseph Martin', 'Sarah Thompson', 'Charles Moore',
  'Karen Lee', 'Christopher Hall', 'Nancy Allen', 'Daniel Young', 'Lisa Hernandez',
  'Matthew King', 'Betty Wright', 'Anthony Lopez', 'Dorothy Hill', 'Mark Scott',
  'Sandra Green', 'Donald Adams', 'Ashley Baker', 'Steven Gonzalez', 'Kimberly Nelson',
];

const HIERARCHIES = ['Driver', 'Driver', 'Driver', 'Driver', 'Field Operator', 'Field Operator', 'Site Supervisor', 'Team Leader', 'Driver', 'Field Operator'];

function rng(seed: number): number {
  // deterministic pseudo-random
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export const driverReports: DriverReport[] = [];

for (let ci = 0; ci < clients.length; ci++) {
  const client = clients[ci];
  // Client safety culture: some clients safer than others
  const baseScore = 55 + (ci % 5) * 8; // 55, 63, 71, 79, 87 cycling

  for (const month of ['2026-02', '2026-03']) {
    const isPrior = month === '2026-02';

    for (let di = 0; di < 10; di++) {
      const seed = ci * 1000 + di * 100 + (isPrior ? 50 : 0);

      // Individual driver score variation around client base
      const scoreVariation = (rng(seed) - 0.5) * 30;
      const rawScore = Math.min(100, Math.max(20, baseScore + scoreVariation));
      // Prior period slightly worse
      const score = isPrior ? Math.max(20, rawScore - rng(seed + 7) * 10) : rawScore;
      const drivingScore = Math.round(score);

      const riskFactor = (100 - score) / 100;
      const r = (s: number) => rng(seed + s);

      const ha = Math.round(Math.max(0, riskFactor * 8 + r(1) * 4 - 1));
      const hb = Math.round(Math.max(0, riskFactor * 10 + r(2) * 5 - 1));
      const hc = Math.round(Math.max(0, riskFactor * 6 + r(3) * 3 - 0.5));
      const os = Math.round(Math.max(0, riskFactor * 7 + r(4) * 4 - 1));
      const ph_call = Math.round(Math.max(0, riskFactor * 4 + r(5) * 2 - 0.5));
      const ph_screen = Math.round(Math.max(0, riskFactor * 3 + r(6) * 2 - 0.5));

      driverReports.push({
        id: `DR-${client.client_id}-${month}-${di}`,
        client_id: client.client_id,
        month,
        employee_name: NAMES[(ci * 10 + di) % NAMES.length],
        hierarchy: HIERARCHIES[di % HIERARCHIES.length],
        distance: Math.round(200 + r(8) * 600),
        avg_speed: Math.round(45 + r(9) * 30),
        max_speed: Math.round(80 + r(10) * 60),
        trips: Math.round(20 + r(11) * 40),
        ph_call,
        ph_screen,
        ph: ph_call + ph_screen,
        ha,
        hb,
        hc,
        os,
        driving_score: drivingScore,
      });
    }
  }
}
