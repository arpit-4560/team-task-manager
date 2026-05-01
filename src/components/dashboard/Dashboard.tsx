import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, CheckSquare, Clock, AlertCircle, TrendingUp, Folder } from 'lucide-react';
import Badge from '../ui/Badge';
import type { Task, Project } from '../../lib/database.types';

interface DashboardProps {
  onNavigate: (view: string, id?: string) => void;
}

interface Stats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
  totalProjects: number;
}

interface TaskWithProject extends Task {
  projects: { name: string };
  assignee: { full_name: string } | null;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalTasks: 0, todoTasks: 0, inProgressTasks: 0, doneTasks: 0, overdueTasks: 0, totalProjects: 0 });
  const [recentTasks, setRecentTasks] = useState<TaskWithProject[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  async function loadDashboard() {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [projectsRes, tasksRes] = await Promise.all([
      supabase.from('project_members').select('project_id').eq('user_id', user!.id),
      supabase
        .from('tasks')
        .select('*, projects(name), assignee:profiles!tasks_assignee_id_fkey(full_name)')
        .order('created_at', { ascending: false }),
    ]);

    const projectIds = (projectsRes.data ?? []).map(m => m.project_id);
    const allTasks = (tasksRes.data ?? []) as TaskWithProject[];

    const todo = allTasks.filter(t => t.status === 'todo').length;
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
    const done = allTasks.filter(t => t.status === 'done').length;
    const overdue = allTasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done');

    setStats({
      totalTasks: allTasks.length,
      todoTasks: todo,
      inProgressTasks: inProgress,
      doneTasks: done,
      overdueTasks: overdue.length,
      totalProjects: projectIds.length,
    });

    setRecentTasks(allTasks.slice(0, 5));
    setOverdueTasks(overdue.slice(0, 5));
    setLoading(false);
  }

  const statCards = [
    { label: 'Total Projects', value: stats.totalProjects, icon: Folder, color: 'text-blue-400', bg: 'bg-blue-900/30' },
    { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: 'text-gray-300', bg: 'bg-gray-800' },
    { label: 'In Progress', value: stats.inProgressTasks, icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
    { label: 'Overdue', value: stats.overdueTasks, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/30' },
  ];

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
        <LayoutDashboard className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {stats.totalTasks > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Overall Progress</h2>
          <div className="flex gap-1 h-2.5 rounded-full overflow-hidden bg-gray-800">
            {stats.doneTasks > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(stats.doneTasks / stats.totalTasks) * 100}%` }}
              />
            )}
            {stats.inProgressTasks > 0 && (
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${(stats.inProgressTasks / stats.totalTasks) * 100}%` }}
              />
            )}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{stats.doneTasks} Done</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{stats.inProgressTasks} In Progress</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600 inline-block" />{stats.todoTasks} To Do</span>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-400" /> Recent Tasks
            </h2>
            <button onClick={() => onNavigate('my-tasks')} className="text-xs text-blue-400 hover:text-blue-300 transition">View all</button>
          </div>
          <div className="divide-y divide-gray-800">
            {recentTasks.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500 text-center">No tasks yet</p>
            ) : (
              recentTasks.map(task => (
                <div key={task.id} className="px-5 py-3 hover:bg-gray-800/50 transition cursor-pointer"
                  onClick={() => onNavigate('project', task.project_id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{task.projects?.name}</p>
                    </div>
                    <Badge variant={task.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400" /> Overdue Tasks
              {stats.overdueTasks > 0 && (
                <span className="ml-auto bg-red-900/50 text-red-300 border border-red-800 text-xs px-2 py-0.5 rounded-full">
                  {stats.overdueTasks}
                </span>
              )}
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {overdueTasks.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500 text-center">No overdue tasks</p>
            ) : (
              overdueTasks.map(task => (
                <div key={task.id} className="px-5 py-3 hover:bg-gray-800/50 transition cursor-pointer"
                  onClick={() => onNavigate('project', task.project_id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{task.title}</p>
                      <p className="text-xs text-red-400 mt-0.5">Due {task.due_date}</p>
                    </div>
                    <Badge variant={task.priority} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
