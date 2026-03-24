import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X, Building2, CheckSquare, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import TaskModal from '../modals/TaskModal';

export default function Header() {
  const { searchQuery, setSearchQuery, searchResults } = useApp();
  const [showResults, setShowResults] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const icons = {
    account: Building2,
    task: CheckSquare,
    activity: MessageSquare,
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-xl">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search accounts, tasks, notes…"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setShowResults(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}

        {showResults && searchQuery && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {searchResults.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">No results found</p>
            ) : (
              searchResults.map((r) => {
                const Icon = icons[r.type];
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => {
                      navigate(r.url);
                      setShowResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left"
                  >
                    <Icon size={14} className="text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 truncate">{r.title}</p>
                      {r.subtitle && <p className="text-xs text-slate-500 truncate">{r.subtitle}</p>}
                    </div>
                    <span className="ml-auto text-xs text-slate-400 capitalize flex-shrink-0">{r.type}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Quick add task */}
      <button
        onClick={() => setShowTaskModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
      >
        <Plus size={16} />
        Add Task
      </button>

      {showTaskModal && <TaskModal isOpen onClose={() => setShowTaskModal(false)} />}
    </header>
  );
}
