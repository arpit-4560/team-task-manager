import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  BarChart2, Sparkles, ArrowRight, Clock,
  AlertCircle, CheckCircle2, TrendingUp
} from 'lucide-react';

interface WelcomeHomeProps {
  onNavigate: (view: string, id?: string) => void;
}

interface QuickStats {
  totalTasks: number;
  inProgress: number;
  overdue: number;
  done: number;
  totalProjects: number;
}

const GREETINGS = (name: string, hour: number) => {
  if (hour < 12) return `Good morning, ${name} ☀️`;
  if (hour < 17) return `Good afternoon, ${name} 👋`;
  return `Good evening, ${name} 🌙`;
};

export default function WelcomeHome({ onNavigate }: WelcomeHomeProps) {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<{ id: string; name: string; color?: string }[]>([]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = GREETINGS(firstName, hour);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    const today = new Date().toISOString().split('T')[0];

    const [{ data: tasks }, { data: projects }] = await Promise.all([
      supabase.from('tasks').select('id, status, due_date'),
      supabase.from('projects').select('id, name').limit(4),
    ]);

    if (tasks) {
      setStats({
        totalTasks: tasks.length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        overdue: tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done').length,
        done: tasks.filter(t => t.status === 'done').length,
        totalProjects: projects?.length || 0,
      });
    }
    if (projects) setRecentProjects(projects);
  }

  const navCards = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      desc: 'Overview of your tasks, progress, and activity',
      color: 'text-blue-400',
      bg: dark ? 'bg-blue-900/20 border-blue-800/40 hover:border-blue-600' : 'bg-blue-50 border-blue-200 hover:border-blue-400',
    },
    {
      id: 'projects',
      icon: FolderKanban,
      label: 'Projects',
      desc: 'Browse and manage all your team projects',
      color: 'text-purple-400',
      bg: dark ? 'bg-purple-900/20 border-purple-800/40 hover:border-purple-600' : 'bg-purple-50 border-purple-200 hover:border-purple-400',
    },
    {
      id: 'my-tasks',
      icon: CheckSquare,
      label: 'My Tasks',
      desc: 'View all tasks assigned to you',
      color: 'text-green-400',
      bg: dark ? 'bg-green-900/20 border-green-800/40 hover:border-green-600' : 'bg-green-50 border-green-200 hover:border-green-400',
    },
    {
      id: 'analytics',
      icon: BarChart2,
      label: 'Analytics',
      desc: 'Track team performance and completion rates',
      color: 'text-yellow-400',
      bg: dark ? 'bg-yellow-900/20 border-yellow-800/40 hover:border-yellow-600' : 'bg-yellow-50 border-yellow-200 hover:border-yellow-400',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">

      {/* Greeting */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>
          {greeting}
        </h1>
        <p className={`text-base ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          Where would you like to go today?
        </p>
      </div>

      {/* Quick stats row */}
      {stats && (
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 p-4 rounded-2xl border ${dark ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
          {[
            { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: 'text-blue-400' },
            { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-yellow-400' },
            { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: stats.overdue > 0 ? 'text-red-400' : 'text-gray-400' },
            { label: 'Completed', value: stats.done, icon: CheckCircle2, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
              <div className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
              <div className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {navCards.map(card => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${card.bg}`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${dark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-base mb-0.5 ${dark ? 'text-white' : 'text-gray-900'}`}>{card.label}</div>
              <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{card.desc}</div>
            </div>
            <ArrowRight className={`w-4 h-4 flex-shrink-0 mt-1 ${dark ? 'text-gray-600' : 'text-gray-400'}`} />
          </button>
        ))}
      </div>

      {/* Recent projects quick access */}
      {recentProjects.length > 0 && (
        <div className={`rounded-2xl border p-5 mb-6 ${dark ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
            <Clock className="w-4 h-4" /> Recent Projects
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {recentProjects.map(p => (
              <button
                key={p.id}
                onClick={() => onNavigate('project', p.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${dark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{p.name}</span>
                <ArrowRight className={`w-3.5 h-3.5 ml-auto flex-shrink-0 ${dark ? 'text-gray-600' : 'text-gray-400'}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights prompt */}
      <div
        onClick={() => onNavigate('projects')}
        className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition hover:scale-[1.01] ${dark ? 'bg-purple-900/10 border-purple-800/30 hover:border-purple-600/50' : 'bg-purple-50 border-purple-200 hover:border-purple-400'}`}
      >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${dark ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <div className={`font-semibold text-sm mb-0.5 ${dark ? 'text-white' : 'text-gray-900'}`}>Try AI Insights</div>
          <div className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Open any project → AI Insights tab → get smart suggestions from Claude</div>
        </div>
        <ArrowRight className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>

    </div>
  );
}
