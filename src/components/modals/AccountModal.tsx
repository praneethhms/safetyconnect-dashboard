import { useState } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import type { Account, Segment, Health, Solution, RenewalStatus } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialAccount?: Account;
}

const SEGMENTS: Segment[] = ['Enterprise', 'Mid-Market', 'Growth', 'SMB'];
const HEALTH_OPTIONS: Health[] = ['Healthy', 'At Risk', 'Critical', 'Unknown'];
const ALL_SOLUTIONS: Solution[] = ['App', 'Forklift', 'Vehicle Tracking', 'Shuttle Bus', 'AI Dashboard', 'Process Safety'];
const RENEWAL_STATUSES: RenewalStatus[] = ['Active', 'Renewed', 'Churned', 'At Risk'];

export default function AccountModal({ isOpen, onClose, initialAccount }: Props) {
  const { addAccount, updateAccount } = useApp();
  const isEdit = !!initialAccount;

  const [form, setForm] = useState({
    name: initialAccount?.name ?? '',
    segment: initialAccount?.segment ?? 'SMB' as Segment,
    solutions: initialAccount?.solutions ?? [] as Solution[],
    location: initialAccount?.location ?? '',
    health: initialAccount?.health ?? 'Unknown' as Health,
    renewalDate: initialAccount?.renewalDate ?? '',
    renewalType: initialAccount?.renewalType ?? '',
    renewalStatus: initialAccount?.renewalStatus ?? 'Active' as RenewalStatus,
    industry: initialAccount?.industry ?? '',
    primaryContact: initialAccount?.primaryContact ?? '',
    champion: initialAccount?.champion ?? '',
    executiveSponsor: initialAccount?.executiveSponsor ?? '',
    devices: initialAccount?.devices?.toString() ?? '',
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleSolution(sol: Solution) {
    setForm((f) => ({
      ...f,
      solutions: f.solutions.includes(sol)
        ? f.solutions.filter((s) => s !== sol)
        : [...f.solutions, sol],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      segment: form.segment,
      solutions: form.solutions,
      location: form.location.trim(),
      health: form.health,
      renewalDate: form.renewalDate || undefined,
      renewalType: form.renewalType || undefined,
      renewalStatus: form.renewalStatus,
      industry: form.industry || undefined,
      primaryContact: form.primaryContact || undefined,
      champion: form.champion || undefined,
      executiveSponsor: form.executiveSponsor || undefined,
      devices: form.devices ? parseInt(form.devices) : undefined,
    };
    if (isEdit) {
      updateAccount(initialAccount!.id, payload);
    } else {
      addAccount(payload);
    }
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Account' : 'Add Account'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Account Name *</label>
            <input required type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Company name…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Segment</label>
            <select value={form.segment} onChange={(e) => set('segment', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {SEGMENTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
            <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="City / Region" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Health</label>
            <select value={form.health} onChange={(e) => set('health', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {HEALTH_OPTIONS.map((h) => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Renewal Status</label>
            <select value={form.renewalStatus} onChange={(e) => set('renewalStatus', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {RENEWAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Renewal Date</label>
            <input type="date" value={form.renewalDate} onChange={(e) => set('renewalDate', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Renewal Type</label>
            <input type="text" value={form.renewalType} onChange={(e) => set('renewalType', e.target.value)} placeholder="Annual / Multi-year…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Industry</label>
            <input type="text" value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder="e.g. Manufacturing" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Devices</label>
            <input type="number" value={form.devices} onChange={(e) => set('devices', e.target.value)} placeholder="Device count" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Primary Contact</label>
            <input type="text" value={form.primaryContact} onChange={(e) => set('primaryContact', e.target.value)} placeholder="Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Champion</label>
            <input type="text" value={form.champion} onChange={(e) => set('champion', e.target.value)} placeholder="Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Executive Sponsor</label>
            <input type="text" value={form.executiveSponsor} onChange={(e) => set('executiveSponsor', e.target.value)} placeholder="Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">Solutions</label>
          <div className="flex flex-wrap gap-2">
            {ALL_SOLUTIONS.map((sol) => (
              <button key={sol} type="button" onClick={() => toggleSolution(sol)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.solutions.includes(sol) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                {sol}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
          <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            {isEdit ? 'Save changes' : 'Add account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
