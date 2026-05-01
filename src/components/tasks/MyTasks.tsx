import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CheckSquare, CalendarDays, Filter } from 'lucide-react';
import Badge from '../ui/Badge';
import type { Task, Profile, TaskStatus, TaskPriority } from '../../lib/database.types';

interface MyTasksProps {
  onNavigate: (view: string, id?: string) => void;
}

interface TaskWithProject extends Task {
  projects: { id: string; name: string };
  assignee: Profile | null;
}

export default function MyTasks({ onNavigate }: MyTasksProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  async function loadTasks() {
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('*, projects(id, name), assignee:profiles!tasks_assignee_id_fkey(*)')
      .or(`assignee_id.eq.${user!.id},created_by.eq.${user!.id}`)
      .order('due_date', { ascending: true, nullsFirst: false });
    setTasks((data ?? []) as TaskWithProject[]);
    setLoading(false);
  }

  async function updateStatus(taskId: string, status: TaskStatus) {
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    loadTasks();
  }

  const filtered = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CheckSquare className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">My Tasks</h1>
        <span className="text-gray-500 text-sm">({filtered.length})</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Filter:</span>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition">
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as TaskPriority | 'all')}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition">
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center justify-center py-16">
          <CheckSquare className="w-10 h-10 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No tasks found</p>
          <p className="text-gray-500 text-sm mt-1">Tasks assigned to you or created by you appear here.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-800">
            {filtered.map(task => {
              const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';
              return (
                <div key={task.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/50 transition">
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={e => updateStatus(task.id, e.target.checked ? 'done' : 'todo')}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
                      {task.title}
                    </p>
                    <button
                      onClick={() => onNavigate('project', task.projects?.id)}
                      className="text-xs text-blue-400 hover:text-blue-300 transition mt-0.5"
                    >
                      {task.projects?.name}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <Badge variant={task.priority} />
                    <Badge variant={task.status} />
                    {task.due_date && (
                      <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                        <CalendarDays className="w-3 h-3" />
                        {task.due_date}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
