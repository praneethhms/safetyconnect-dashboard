import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import type {
  Account,
  Task,
  Activity,
  Meeting,
  Contact,
  WeeklyNote,
  SearchResult,
} from '../types';
import {
  loadAccounts,
  saveAccounts,
  loadTasks,
  saveTasks,
  loadActivities,
  saveActivities,
  loadMeetings,
  saveMeetings,
  loadContacts,
  saveContacts,
  loadWeeklyNotes,
  saveWeeklyNotes,
  initStorage,
} from '../utils/storage';
import { seedData } from '../data/seed';
import {
  generateId,
  now,
  daysAgo,
  daysFromNow,
  isOverdue,
  isDueToday,
} from '../utils/helpers';
import { parseISO } from 'date-fns';

interface AppContextType {
  accounts: Account[];
  tasks: Task[];
  activities: Activity[];
  meetings: Meeting[];
  contacts: Contact[];
  weeklyNotes: WeeklyNote[];

  addAccount: (a: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  bulkUpdateTasks: (ids: string[], updates: Partial<Task>) => void;

  addActivity: (a: Omit<Activity, 'id' | 'createdAt'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;

  addMeeting: (m: Omit<Meeting, 'id' | 'createdAt'>) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;

  addContact: (c: Omit<Contact, 'id' | 'createdAt'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  saveWeeklyNote: (weekKey: string, updates: Partial<Omit<WeeklyNote, 'id' | 'weekKey' | 'createdAt'>>) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchResult[];

  tasksDueToday: Task[];
  overdueTasks: Task[];
  accountsNeedingAttention: Account[];
  upcomingRenewals: Account[];
  lastActivityDate: (accountId: string) => string | null;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [weeklyNotes, setWeeklyNotes] = useState<WeeklyNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    initStorage(seedData);
    setAccounts(loadAccounts());
    setTasks(loadTasks());
    setActivities(loadActivities());
    setMeetings(loadMeetings());
    setContacts(loadContacts());
    setWeeklyNotes(loadWeeklyNotes());
  }, []);

  // Accounts
  const addAccount = useCallback((a: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Account => {
    const newAccount: Account = { ...a, id: generateId(), createdAt: now(), updatedAt: now() };
    setAccounts((prev) => {
      const next = [...prev, newAccount];
      saveAccounts(next);
      return next;
    });
    return newAccount;
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setAccounts((prev) => {
      const next = prev.map((a) => a.id === id ? { ...a, ...updates, updatedAt: now() } : a);
      saveAccounts(next);
      return next;
    });
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveAccounts(next);
      return next;
    });
  }, []);

  // Tasks
  const addTask = useCallback((t: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const newTask: Task = { ...t, id: generateId(), createdAt: now(), updatedAt: now() };
    setTasks((prev) => {
      const next = [...prev, newTask];
      saveTasks(next);
      return next;
    });
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const next = prev.map((t) => t.id === id ? { ...t, ...updates, updatedAt: now() } : t);
      saveTasks(next);
      return next;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTasks(next);
      return next;
    });
  }, []);

  const bulkUpdateTasks = useCallback((ids: string[], updates: Partial<Task>) => {
    setTasks((prev) => {
      const next = prev.map((t) => ids.includes(t.id) ? { ...t, ...updates, updatedAt: now() } : t);
      saveTasks(next);
      return next;
    });
  }, []);

  // Activities
  const addActivity = useCallback((a: Omit<Activity, 'id' | 'createdAt'>) => {
    const newActivity: Activity = { ...a, id: generateId(), createdAt: now() };
    setActivities((prev) => {
      const next = [...prev, newActivity];
      saveActivities(next);
      return next;
    });
  }, []);

  const updateActivity = useCallback((id: string, updates: Partial<Activity>) => {
    setActivities((prev) => {
      const next = prev.map((a) => a.id === id ? { ...a, ...updates } : a);
      saveActivities(next);
      return next;
    });
  }, []);

  const deleteActivity = useCallback((id: string) => {
    setActivities((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveActivities(next);
      return next;
    });
  }, []);

  // Meetings
  const addMeeting = useCallback((m: Omit<Meeting, 'id' | 'createdAt'>) => {
    const newMeeting: Meeting = { ...m, id: generateId(), createdAt: now() };
    setMeetings((prev) => {
      const next = [...prev, newMeeting];
      saveMeetings(next);
      return next;
    });
  }, []);

  const updateMeeting = useCallback((id: string, updates: Partial<Meeting>) => {
    setMeetings((prev) => {
      const next = prev.map((m) => m.id === id ? { ...m, ...updates } : m);
      saveMeetings(next);
      return next;
    });
  }, []);

  const deleteMeeting = useCallback((id: string) => {
    setMeetings((prev) => {
      const next = prev.filter((m) => m.id !== id);
      saveMeetings(next);
      return next;
    });
  }, []);

  // Contacts
  const addContact = useCallback((c: Omit<Contact, 'id' | 'createdAt'>) => {
    const newContact: Contact = { ...c, id: generateId(), createdAt: now() };
    setContacts((prev) => {
      const next = [...prev, newContact];
      saveContacts(next);
      return next;
    });
  }, []);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setContacts((prev) => {
      const next = prev.map((c) => c.id === id ? { ...c, ...updates } : c);
      saveContacts(next);
      return next;
    });
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveContacts(next);
      return next;
    });
  }, []);

  // Weekly Notes
  const saveWeeklyNote = useCallback((weekKey: string, updates: Partial<Omit<WeeklyNote, 'id' | 'weekKey' | 'createdAt'>>) => {
    setWeeklyNotes((prev) => {
      const existing = prev.find((n) => n.weekKey === weekKey);
      let next: WeeklyNote[];
      if (existing) {
        next = prev.map((n) => n.weekKey === weekKey ? { ...n, ...updates, updatedAt: now() } : n);
      } else {
        next = [...prev, { id: generateId(), weekKey, notes: '', standupChecklist: [], createdAt: now(), updatedAt: now(), ...updates }];
      }
      saveWeeklyNotes(next);
      return next;
    });
  }, []);

  // Last activity date per account
  const lastActivityDate = useCallback((accountId: string): string | null => {
    const accountActivities = activities.filter((a) => a.accountId === accountId);
    if (accountActivities.length === 0) return null;
    const sorted = [...accountActivities].sort((a, b) =>
      parseISO(b.date).getTime() - parseISO(a.date).getTime()
    );
    return sorted[0].date;
  }, [activities]);

  // Computed values
  const tasksDueToday = useMemo(
    () => tasks.filter((t) => t.status !== 'Done' && isDueToday(t.dueDate)),
    [tasks]
  );

  const overdueTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'Done' && isOverdue(t.dueDate, t.status)),
    [tasks]
  );

  const accountsNeedingAttention = useMemo(() => {
    return accounts.filter((acc) => {
      const lastDate = activities
        .filter((a) => a.accountId === acc.id)
        .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0]?.date;
      if (!lastDate) return true;
      return daysAgo(lastDate) >= 7;
    });
  }, [accounts, activities]);

  const upcomingRenewals = useMemo(() => {
    return accounts
      .filter((a) => a.renewalDate && daysFromNow(a.renewalDate) <= 90)
      .sort((a, b) => daysFromNow(a.renewalDate!) - daysFromNow(b.renewalDate!));
  }, [accounts]);

  // Search
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    accounts.forEach((a) => {
      if (a.name.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)) {
        results.push({ type: 'account', id: a.id, title: a.name, subtitle: a.location, url: `/accounts/${a.id}` });
      }
    });

    tasks.forEach((t) => {
      if (t.title.toLowerCase().includes(q)) {
        const acc = accounts.find((a) => a.id === t.accountId);
        results.push({ type: 'task', id: t.id, title: t.title, subtitle: acc?.name, url: '/tasks' });
      }
    });

    activities.forEach((a) => {
      if (a.note.toLowerCase().includes(q)) {
        const acc = accounts.find((ac) => ac.id === a.accountId);
        results.push({ type: 'activity', id: a.id, title: a.note.slice(0, 60) + '...', subtitle: acc?.name, url: `/accounts/${a.accountId}` });
      }
    });

    return results.slice(0, 10);
  }, [searchQuery, accounts, tasks, activities]);

  const value: AppContextType = {
    accounts, tasks, activities, meetings, contacts, weeklyNotes,
    addAccount, updateAccount, deleteAccount,
    addTask, updateTask, deleteTask, bulkUpdateTasks,
    addActivity, updateActivity, deleteActivity,
    addMeeting, updateMeeting, deleteMeeting,
    addContact, updateContact, deleteContact,
    saveWeeklyNote,
    searchQuery, setSearchQuery, searchResults,
    tasksDueToday, overdueTasks, accountsNeedingAttention, upcomingRenewals,
    lastActivityDate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
