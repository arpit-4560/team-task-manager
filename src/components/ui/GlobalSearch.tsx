import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, X, FolderKanban, CheckSquare, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SearchResult {
  id: string;
  type: 'project' | 'task';
  title: string;
  subtitle?: string;
  projectId?: string;
}

interface GlobalSearchProps {
  onNavigate: (view: string, id?: string) => void;
}

export default function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(''); setResults([]); }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  async function search(q: string) {
    setLoading(true);
    const term = `%${q}%`;

    const [{ data: projects }, { data: tasks }] = await Promise.all([
      supabase.from('projects').select('id, name, description').ilike('name', term).limit(4),
      supabase.from('tasks').select('id, title, status, project_id, project:projects(name)').ilike('title', term).limit(6),
    ]);

    const r: SearchResult[] = [
      ...(projects || []).map(p => ({ id: p.id, type: 'project' as const, title: p.name, subtitle: p.description || 'Project' })),
      ...(tasks || []).map(t => ({ id: t.id, type: 'task' as const, title: t.title, subtitle: (t.project as any)?.name || 'Task', projectId: t.project_id })),
    ];

    setResults(r);
    setSelected(0);
    setLoading(false);
  }

  function handleSelect(r: SearchResult) {
    if (r.type === 'project') onNavigate('project', r.id);
    else if (r.projectId) onNavigate('project', r.projectId);
    setOpen(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) handleSelect(results[selected]);
  }

  const statusColor: Record<string, string> = {
    done: 'text-green-400', in_progress: 'text-yellow-400', todo: 'text-gray-400'
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${dark ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd className={`hidden sm:inline text-xs px-1.5 py-0.5 rounded ${dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>⌘K</kbd>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
          onClick={() => setOpen(false)}>
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${dark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}
            onClick={e => e.stopPropagation()}>

            {/* Input */}
            <div className={`flex items-center gap-3 px-4 py-3.5 border-b ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-blue-400 flex-shrink-0" /> : <Search className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />}
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Search tasks, projects..."
                className={`flex-1 bg-transparent outline-none text-sm ${dark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
              />
              {query && (
                <button onClick={() => setQuery('')} className={dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {!query && (
                <div className={`px-4 py-8 text-center text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Type to search tasks and projects...
                </div>
              )}
              {query && results.length === 0 && !loading && (
                <div className={`px-4 py-8 text-center text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No results for "<strong>{query}</strong>"
                </div>
              )}
              {results.map((r, i) => (
                <button
                  key={r.id + r.type}
                  onClick={() => handleSelect(r)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                    i === selected
                      ? dark ? 'bg-blue-600/20' : 'bg-blue-50'
                      : dark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    r.type === 'project'
                      ? dark ? 'bg-purple-900/40' : 'bg-purple-100'
                      : dark ? 'bg-blue-900/40' : 'bg-blue-100'
                  }`}>
                    {r.type === 'project'
                      ? <FolderKanban className={`w-4 h-4 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
                      : <CheckSquare className={`w-4 h-4 ${dark ? 'text-blue-400' : 'text-blue-600'}`} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{r.title}</p>
                    <p className={`text-xs truncate ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {r.type === 'project' ? '📁 Project' : `📋 Task · ${r.subtitle}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer hint */}
            <div className={`px-4 py-2.5 border-t text-xs flex gap-4 ${dark ? 'border-gray-800 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>Esc close</span>
            </div>
          </div>

          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10" />
        </div>
      )}
    </>
  );
}
