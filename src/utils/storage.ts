import type {
  Account,
  Task,
  Activity,
  Meeting,
  Contact,
  WeeklyNote,
} from '../types';

const KEYS = {
  accounts: 'csm_accounts',
  tasks: 'csm_tasks',
  activities: 'csm_activities',
  meetings: 'csm_meetings',
  contacts: 'csm_contacts',
  weeklyNotes: 'csm_weekly_notes',
  seeded: 'csm_seeded',
} as const;

type Key = keyof typeof KEYS;

function load<T>(key: Key): T[] {
  try {
    const raw = localStorage.getItem(KEYS[key]);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: Key, data: T[]): void {
  localStorage.setItem(KEYS[key], JSON.stringify(data));
}

export function loadAccounts(): Account[] {
  return load<Account>('accounts');
}
export function saveAccounts(data: Account[]): void {
  save('accounts', data);
}

export function loadTasks(): Task[] {
  return load<Task>('tasks');
}
export function saveTasks(data: Task[]): void {
  save('tasks', data);
}

export function loadActivities(): Activity[] {
  return load<Activity>('activities');
}
export function saveActivities(data: Activity[]): void {
  save('activities', data);
}

export function loadMeetings(): Meeting[] {
  return load<Meeting>('meetings');
}
export function saveMeetings(data: Meeting[]): void {
  save('meetings', data);
}

export function loadContacts(): Contact[] {
  return load<Contact>('contacts');
}
export function saveContacts(data: Contact[]): void {
  save('contacts', data);
}

export function loadWeeklyNotes(): WeeklyNote[] {
  return load<WeeklyNote>('weeklyNotes');
}
export function saveWeeklyNotes(data: WeeklyNote[]): void {
  save('weeklyNotes', data);
}

export function isSeeded(): boolean {
  return localStorage.getItem(KEYS.seeded) === 'true';
}

export function markSeeded(): void {
  localStorage.setItem(KEYS.seeded, 'true');
}

export interface SeedPayload {
  accounts: Account[];
  tasks: Task[];
  activities: Activity[];
  meetings: Meeting[];
  contacts: Contact[];
  weeklyNotes: WeeklyNote[];
}

export function initStorage(seed: SeedPayload): void {
  if (!isSeeded()) {
    saveAccounts(seed.accounts);
    saveTasks(seed.tasks);
    saveActivities(seed.activities);
    saveMeetings(seed.meetings);
    saveContacts(seed.contacts);
    saveWeeklyNotes(seed.weeklyNotes);
    markSeeded();
  }
}
