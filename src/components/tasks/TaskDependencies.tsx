import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { Link2, X, Plus, Loader2, Lock, CheckCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
}

interface TaskDependenciesProps {
  taskId: string;
  projectId: string;
  canEdit: boolean;
}

export default function TaskDependencies({ taskId, projectId, canEdit }: TaskDependenciesProps) {
  const [dependencies, setDependencies] = useState<Task[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const isBlocked = dependencies.some(d => d.status !== 'done');

  useEffect(() => { fetchDeps(); fetchProjectTasks(); }, [taskId]);

  async function fetchDeps() {
    setLoading(true);
    const { data } = await supabase
      .from('task_dependencies')
      .select('depends_on_id, depends_on:tasks!task_dependencies_depends_on_id_fkey(id, title, status)')
      .eq('task_id', taskId);

    if (data) setDependencies(data.map((d: any) => d.depends_on));
    setLoading(false);
  }

  async function fetchProjectTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('id, title, status')
      .eq('project_id', projectId)
      .neq('id', taskId);
    if (data) setProjectTasks(data);
  }

  async function addDependency(dependsOnId: string) {
    setAdding(true);
    await supabase.from('task_dependencies').insert({ task_id: taskId, depends_on_id: dependsOnId });
    await fetchDeps();
    setShowPicker(false);
    setAdding(false);
  }

  async function removeDependency(dependsOnId: string) {
    await supabase.from('task_dependencies').delete()
      .eq('task_id', taskId).eq('depends_on_id', dependsOnId);
    setDependencies(prev => prev.filter(d => d.id !== dependsOnId));
  }

  const available = projectTasks.filter(t => !dependencies.find(d => d.id === t.id));

  const statusIcon = (status: string) =>
    status === 'done'
      ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
      : <Lock className="w-3.5 h-3.5 text-yellow-400" />;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-medium flex items-center gap-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
          <Link2 className="w-4 h-4" />
          Dependencies
          {isBlocked && (
            <span className="text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> Blocked
            </span>
          )}
        </h3>
        {canEdit && available.length > 0 && (
          <button onClick={() => setShowPicker(v => !v)}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition ${dark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>

      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      ) : dependencies.length === 0 ? (
        <p className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>No dependencies</p>
      ) : (
        <div className="space-y-1.5">
          {dependencies.map(dep => (
            <div key={dep.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm group ${
              dep.status === 'done'
                ? dark ? 'bg-green-900/10 border border-green-900/30' : 'bg-green-50 border border-green-200'
                : dark ? 'bg-yellow-900/10 border border-yellow-900/30' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              {statusIcon(dep.status)}
              <span className={`flex-1 truncate text-xs ${dep.status === 'done' ? 'line-through opacity-60' : dark ? 'text-gray-300' : 'text-gray-700'}`}>
                {dep.title}
              </span>
              <span className={`text-[10px] ${dep.status === 'done' ? 'text-green-400' : 'text-yellow-500'}`}>
                {dep.status === 'done' ? 'Done' : 'Pending'}
              </span>
              {canEdit && (
                <button onClick={() => removeDependency(dep.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dependency picker */}
      {showPicker && available.length > 0 && (
        <div className={`mt-2 rounded-xl border overflow-hidden shadow-lg ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs px-3 py-2 border-b font-medium ${dark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-100'}`}>
            Block this task until:
          </p>
          <div className="max-h-40 overflow-y-auto">
            {available.map(t => (
              <button key={t.id} onClick={() => addDependency(t.id)} disabled={adding}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition ${dark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                {statusIcon(t.status)}
                <span className="truncate">{t.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isBlocked && (
        <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
          <Lock className="w-3 h-3" /> This task is blocked — complete dependencies first
        </p>
      )}
    </div>
  );
}
