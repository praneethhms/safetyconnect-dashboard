import {
  format,
  differenceInDays,
  parseISO,
  isToday,
  isBefore,
  startOfDay,
  getISOWeek,
  getYear,
  startOfISOWeek,
  endOfISOWeek,
  isWithinInterval,
} from 'date-fns';

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, HH:mm');
  } catch {
    return dateStr;
  }
}

export function daysFromNow(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), startOfDay(new Date()));
}

export function daysAgo(dateStr: string): number {
  return differenceInDays(startOfDay(new Date()), parseISO(dateStr));
}

export function isDueToday(dateStr: string): boolean {
  return isToday(parseISO(dateStr));
}

export function isOverdue(dateStr: string, status?: string): boolean {
  if (status === 'Done') return false;
  return isBefore(parseISO(dateStr), startOfDay(new Date()));
}

export function getUrgencyColor(dateStr: string): 'red' | 'amber' | 'green' | null {
  const days = daysFromNow(dateStr);
  if (days <= 30) return 'red';
  if (days <= 60) return 'amber';
  if (days <= 90) return 'green';
  return null;
}

export function getUrgencyEmoji(dateStr: string): string {
  const days = daysFromNow(dateStr);
  if (days <= 30) return '🔴';
  if (days <= 60) return '🟡';
  if (days <= 90) return '🟢';
  return '⚪';
}

export function getWeekKey(): string {
  const now = new Date();
  const year = getYear(now);
  const week = getISOWeek(now);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function isThisWeek(dateStr: string): boolean {
  try {
    const now = new Date();
    return isWithinInterval(parseISO(dateStr), {
      start: startOfISOWeek(now),
      end: endOfISOWeek(now),
    });
  } catch {
    return false;
  }
}

export function generateId(): string {
  return (
    Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
  );
}

export function now(): string {
  return new Date().toISOString();
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
