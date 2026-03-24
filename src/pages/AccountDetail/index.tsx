import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Pencil } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HealthBadge, SegmentBadge, SolutionTag } from '../../components/common/Badge';
import AccountModal from '../../components/modals/AccountModal';
import Overview from './tabs/Overview';
import ActivityLog from './tabs/ActivityLog';
import AccountTasks from './tabs/Tasks';
import Meetings from './tabs/Meetings';
import Stakeholders from './tabs/Stakeholders';
import Renewal from './tabs/Renewal';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity Log' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'meetings', label: 'Meetings & Next Steps' },
  { id: 'stakeholders', label: 'Stakeholders' },
  { id: 'renewal', label: 'Renewal' },
];

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const { accounts, tasks, activities } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);

  const account = accounts.find((a) => a.id === id);

  if (!account) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500 mb-4">Account not found.</p>
        <Link to="/accounts" className="text-indigo-600 hover:underline text-sm">← Back to Accounts</Link>
      </div>
    );
  }

  const openTaskCount = tasks.filter((t) => t.accountId === id && t.status !== 'Done').length;
  const activityCount = activities.filter((a) => a.accountId === id).length;

  function renderTab() {
    if (!id) return null;
    switch (activeTab) {
      case 'overview': return <Overview account={account!} />;
      case 'activity': return <ActivityLog accountId={id} />;
      case 'tasks': return <AccountTasks accountId={id} />;
      case 'meetings': return <Meetings accountId={id} />;
      case 'stakeholders': return <Stakeholders accountId={id} />;
      case 'renewal': return <Renewal account={account!} />;
      default: return null;
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Account header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <button onClick={() => navigate('/accounts')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mb-3 transition-colors">
          <ChevronLeft size={14} /> Accounts
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-xl font-bold text-slate-900">{account.name}</h1>
              <HealthBadge health={account.health} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <SegmentBadge segment={account.segment} />
              {account.solutions.map((s) => <SolutionTag key={s} solution={s} />)}
              {account.location && <span className="text-xs text-slate-500">📍 {account.location}</span>}
              {account.industry && <span className="text-xs text-slate-500">• {account.industry}</span>}
            </div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex-shrink-0"
          >
            <Pencil size={14} /> Edit
          </button>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-6 mt-4 text-xs text-slate-500">
          <span className="font-medium">{openTaskCount} open tasks</span>
          <span>{activityCount} activities logged</span>
          {account.devices && <span>{account.devices.toLocaleString()} devices</span>}
          {account.primaryContact && <span>POC: {account.primaryContact}</span>}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-5 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {renderTab()}
        </div>
      </div>

      {showEditModal && <AccountModal isOpen onClose={() => setShowEditModal(false)} initialAccount={account} />}
    </div>
  );
}
