export type Segment = 'Enterprise' | 'Mid-Market' | 'Growth' | 'SMB';
export type Health = 'Healthy' | 'At Risk' | 'Critical' | 'Unknown';
export type Solution =
  | 'App'
  | 'Forklift'
  | 'Vehicle Tracking'
  | 'Shuttle Bus'
  | 'AI Dashboard'
  | 'Process Safety';
export type Priority = 'High' | 'Med' | 'Low';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskCategory =
  | 'Onboarding'
  | 'Renewal'
  | 'Escalation'
  | 'Expansion'
  | 'Health'
  | 'Admin'
  | 'Follow-up'
  | 'Other';
export type ActivityType =
  | 'Call'
  | 'Email'
  | 'Meeting'
  | 'Internal Note'
  | 'QBR'
  | 'Onboarding'
  | 'Escalation'
  | 'Check-in'
  | 'Training'
  | 'Other';
export type MeetingType =
  | 'QBR'
  | 'Check-in'
  | 'Kick-off'
  | 'Escalation call'
  | 'Executive review'
  | 'Training'
  | 'Demo';
export type ContactRole =
  | 'Champion'
  | 'Sponsor'
  | 'Blocker'
  | 'Influencer'
  | 'End User'
  | 'Admin'
  | 'IT contact';
export type RelationshipStrength = 'Strong' | 'Neutral' | 'Weak';
export type RenewalStatus = 'Active' | 'Renewed' | 'Churned' | 'At Risk';

export interface Account {
  id: string;
  name: string;
  segment: Segment;
  solutions: Solution[];
  location: string;
  health: Health;
  renewalDate?: string;
  renewalType?: string;
  industry?: string;
  primaryContact?: string;
  champion?: string;
  executiveSponsor?: string;
  devices?: number;
  healthScore?: number;
  riskNotes?: string;
  renewalStatus: RenewalStatus;
  nextRenewalAction?: string;
  nextRenewalActionOwner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  category: TaskCategory;
  accountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  accountId: string;
  date: string;
  type: ActivityType;
  note: string;
  createdBy: string;
  pinned: boolean;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  description: string;
  owner: string;
  dueDate: string;
  status: TaskStatus;
}

export interface Meeting {
  id: string;
  accountId: string;
  date: string;
  meetingType: MeetingType;
  attendees: string;
  summary: string;
  actionItems: ActionItem[];
  nextScheduledMeeting?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  title: string;
  role: ContactRole;
  email: string;
  phone: string;
  relationshipStrength: RelationshipStrength;
  notes: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface WeeklyNote {
  id: string;
  weekKey: string;
  notes: string;
  standupChecklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  type: 'account' | 'task' | 'activity';
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}
