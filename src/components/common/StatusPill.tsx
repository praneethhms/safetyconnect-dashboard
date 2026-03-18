interface StatusPillProps { status: 'green' | 'amber' | 'red'; label: string }
export function StatusPill({ status, label }: StatusPillProps) {
  const cls = {
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  }[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}
