import { useState } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import type { Contact, ContactRole, RelationshipStrength } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  initialContact?: Contact;
}

const ROLES: ContactRole[] = ['Champion', 'Sponsor', 'Blocker', 'Influencer', 'End User', 'Admin', 'IT contact'];
const STRENGTHS: RelationshipStrength[] = ['Strong', 'Neutral', 'Weak'];

export default function ContactModal({ isOpen, onClose, accountId, initialContact }: Props) {
  const { addContact, updateContact } = useApp();
  const isEdit = !!initialContact;

  const [form, setForm] = useState({
    name: initialContact?.name ?? '',
    title: initialContact?.title ?? '',
    role: initialContact?.role ?? 'Champion' as ContactRole,
    email: initialContact?.email ?? '',
    phone: initialContact?.phone ?? '',
    relationshipStrength: initialContact?.relationshipStrength ?? 'Neutral' as RelationshipStrength,
    notes: initialContact?.notes ?? '',
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      accountId,
      name: form.name.trim(),
      title: form.title,
      role: form.role,
      email: form.email,
      phone: form.phone,
      relationshipStrength: form.relationshipStrength,
      notes: form.notes,
    };
    if (isEdit) {
      updateContact(initialContact!.id, payload);
    } else {
      addContact(payload);
    }
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Contact' : 'Add Contact'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Name *</label>
            <input required type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Job title" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Relationship</label>
            <select value={form.relationshipStrength} onChange={(e) => set('relationshipStrength', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {STRENGTHS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@company.com" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 99999 00000" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
          <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Relationship notes, preferences…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
          <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            {isEdit ? 'Save changes' : 'Add contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
