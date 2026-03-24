import type { Health, Priority, TaskStatus, Segment, RelationshipStrength } from '../../types';

// Health badge
export function HealthBadge({ health }: { health: Health }) {
  const styles: Record<Health, string> = {
    Healthy: 'bg-green-100 text-green-700',
    'At Risk': 'bg-amber-100 text-amber-700',
    Critical: 'bg-red-100 text-red-700',
    Unknown: 'bg-slate-100 text-slate-500',
  };
  const icons: Record<Health, string> = {
    Healthy: '🟢',
    'At Risk': '🟡',
    Critical: '🔴',
    Unknown: '⚪',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[health]}`}>
      {icons[health]} {health}
    </span>
  );
}

// Priority badge
export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    High: 'bg-red-100 text-red-700',
    Med: 'bg-amber-100 text-amber-700',
    Low: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`}>
      {priority}
    </span>
  );
}

// Task status badge
export function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    'To Do': 'bg-slate-100 text-slate-600',
    'In Progress': 'bg-blue-100 text-blue-700',
    Done: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

// Segment badge
export function SegmentBadge({ segment }: { segment: Segment }) {
  const styles: Record<Segment, string> = {
    Enterprise: 'bg-indigo-100 text-indigo-700',
    'Mid-Market': 'bg-purple-100 text-purple-700',
    Growth: 'bg-teal-100 text-teal-700',
    SMB: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[segment]}`}>
      {segment}
    </span>
  );
}

// Urgency badge for renewals
export function UrgencyBadge({ days }: { days: number }) {
  if (days < 0) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">🔴 Overdue</span>;
  }
  if (days <= 30) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">🔴 {days}d left</span>;
  }
  if (days <= 60) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">🟡 {days}d left</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">🟢 {days}d left</span>;
}

// Relationship strength badge
export function StrengthBadge({ strength }: { strength: RelationshipStrength }) {
  const styles: Record<RelationshipStrength, string> = {
    Strong: 'bg-green-100 text-green-700',
    Neutral: 'bg-slate-100 text-slate-600',
    Weak: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[strength]}`}>
      {strength}
    </span>
  );
}

// Solution tag
export function SolutionTag({ solution }: { solution: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
      {solution}
    </span>
  );
}
