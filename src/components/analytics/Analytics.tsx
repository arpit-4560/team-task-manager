import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart2, TrendingUp, Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import type { MemberRole } from '../../lib/database.types';

interface AnalyticsProps {
  projectId?: string; // if provided, show project-level analytics
}

interface MemberStat {
  name: string;
  total: number;
  done: number;
  in_progress: number;
  todo: number;
  overdue: number;
}

interface WeekStat {
  label: string;
  done: number;
}

export default function Analytics({ projectId }: AnalyticsProps) {
  const { user } = useAuth();
  const [memberStats, setMemberStats] = useState<MemberStat[]>([]);
  const [weekStats, setWeekStats] = useState<WeekStat[]>([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [avgCompletionDays, setAvgCompletionDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<MemberRole | null>(null);

  useEffect(() => {
    load();
  }, [projectId]);

  async function load() {
    setLoading(true);

    // Get my role if project-level
    if (projectId) {
      const { data: roleData } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user!.id)
        .maybeSingle();
      setMyRole((roleData?.role as MemberRole) ?? null);
    }

    // Fetch tasks
    let query = supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assignee_id_fkey(full_name), project:projects(name)');
    if (projectId) query = query.eq('project_id', projectId);

    const { data: tasks } = await query;
    if (!tasks) { setLoading(false); return; }

    const today = new Date().toISOString().split('T')[0];

    // Completion rate
    const done = tasks.filter(t => t.status === 'done').length;
    setCompletionRate(tasks.length ? Math.round((done / tasks.length) * 100) : 0);

    // Per-member stats
    const memberMap: Record<string, MemberStat> = {};
    tasks.forEach(t => {
      const name = (t.assignee as any)?.full_name || 'Unassigned';
      if (!memberMap[name]) memberMap[name] = { name, total: 0, done: 0, in_progress: 0, todo: 0, overdue: 0 };
      memberMap[name].total++;
      if (t.status === 'done') memberMap[name].done++;
      else if (t.status === 'in_progress') memberMap[name].in_progress++;
      else memberMap[name].todo++;
      if (t.due_date && t.due_date < today && t.status !== 'done') memberMap[name].overdue++;
    });
    setMemberStats(Object.values(memberMap).sort((a, b) => b.total - a.total));

    // Weekly completion (last 7 days)
    const week: WeekStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const doneThat = tasks.filter(t => t.updated_at?.startsWith(dayStr) && t.status === 'done').length;
      week.push({ label, done: doneThat });
    }
    setWeekStats(week);

    setLoading(false);
  }

  const maxBar = Math.max(...weekStats.map(w => w.done), 1);
  const maxMember = Math.max(...memberStats.map(m => m.total), 1);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart2 className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Analytics</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Completion Rate', value: completionRate + '%', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20' },
          { label: 'Total Members', value: memberStats.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-900/20' },
          { label: 'Overdue Tasks', value: memberStats.reduce((a, m) => a + m.overdue, 0), icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/20' },
          { label: 'In Progress', value: memberStats.reduce((a, m) => a + m.in_progress, 0), icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Weekly activity bar chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" /> Tasks Completed — Last 7 Days
        </h3>
        <div className="flex items-end gap-2 h-28">
          {weekStats.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">{w.done || ''}</span>
              <div className="w-full rounded-t-md bg-blue-600/80 transition-all"
                style={{ height: `${(w.done / maxBar) * 80}px`, minHeight: w.done ? 4 : 0 }} />
              <span className="text-[10px] text-gray-500">{w.label}</span>
            </div>
          ))}
        </div>
        {weekStats.every(w => w.done === 0) && (
          <p className="text-xs text-gray-600 text-center mt-2">No tasks completed this week</p>
        )}
      </div>

      {/* Per-member breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" /> Workload by Member
        </h3>
        {memberStats.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No data yet</p>
        ) : (
          <div className="space-y-3">
            {memberStats.map(m => (
              <div key={m.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300 font-medium">{m.name}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="text-green-400">{m.done} done</span>
                    <span>·</span>
                    <span className="text-yellow-400">{m.in_progress} active</span>
                    {m.overdue > 0 && <><span>·</span><span className="text-red-400">{m.overdue} overdue</span></>}
                    <span className="text-gray-400 ml-1">{m.total} total</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                  <div className="bg-green-500 h-full transition-all" style={{ width: `${(m.done / maxMember) * 100}%` }} />
                  <div className="bg-blue-500 h-full transition-all" style={{ width: `${(m.in_progress / maxMember) * 100}%` }} />
                  <div className="bg-gray-600 h-full transition-all" style={{ width: `${(m.todo / maxMember) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full inline-block" />Done</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />In Progress</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-gray-600 rounded-full inline-block" />To Do</span>
        </div>
      </div>
    </div>
  );
}
