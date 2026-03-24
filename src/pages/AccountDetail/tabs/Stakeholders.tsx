import { useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { StrengthBadge } from '../../../components/common/Badge';
import ContactModal from '../../../components/modals/ContactModal';
import EmptyState from '../../../components/common/EmptyState';
import type { Contact } from '../../../types';

interface Props {
  accountId: string;
}

const ROLE_COLORS: Record<string, string> = {
  Champion: 'bg-green-100 text-green-700',
  Sponsor: 'bg-indigo-100 text-indigo-700',
  Blocker: 'bg-red-100 text-red-700',
  Influencer: 'bg-purple-100 text-purple-700',
  'End User': 'bg-slate-100 text-slate-600',
  Admin: 'bg-amber-100 text-amber-700',
  'IT contact': 'bg-teal-100 text-teal-700',
};

export default function Stakeholders({ accountId }: Props) {
  const { contacts, deleteContact } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  const accountContacts = contacts
    .filter((c) => c.accountId === accountId)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{accountContacts.length} contacts</span>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={15} /> Add Contact
        </button>
      </div>

      {accountContacts.length === 0 ? (
        <EmptyState icon={Users} title="No contacts" description="Add stakeholders — champions, sponsors, influencers, and blockers." action={
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg">
            <Plus size={14} /> Add contact
          </button>
        } />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {accountContacts.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                  {c.title && <p className="text-xs text-slate-500">{c.title}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditContact(c)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"><Pencil size={13} /></button>
                  <button onClick={() => deleteContact(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100"><Trash2 size={13} /></button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[c.role] ?? 'bg-slate-100 text-slate-600'}`}>{c.role}</span>
                <StrengthBadge strength={c.relationshipStrength} />
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                {c.email && (
                  <p className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-400">✉</span>
                    <a href={`mailto:${c.email}`} className="hover:text-indigo-600 truncate">{c.email}</a>
                  </p>
                )}
                {c.phone && (
                  <p className="flex items-center gap-1.5">
                    <span className="text-slate-400">📞</span>
                    <a href={`tel:${c.phone}`} className="hover:text-indigo-600">{c.phone}</a>
                  </p>
                )}
              </div>

              {c.notes && (
                <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-2">{c.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && <ContactModal isOpen onClose={() => setShowAddModal(false)} accountId={accountId} />}
      {editContact && <ContactModal isOpen onClose={() => setEditContact(null)} accountId={accountId} initialContact={editContact} />}
    </div>
  );
}
