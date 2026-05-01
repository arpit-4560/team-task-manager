import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CalendarDays, Trash2, CreditCard as Edit2 } from 'lucide-react';
import Badge from '../ui/Badge';
import EditTaskModal from './EditTaskModal';
import type { Task, Profile, ProjectMemberWithProfile, TaskStatus } from '../../lib/database.types';

interface TaskCardProps {
  task: Task & { assignee: Profile | null };
  members: ProjectMemberWithProfile[];
  myRole: 'admin' | 'member' | null;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

const STATUS_OPTIONS: TaskStatus[] = ['todo', 'in_progress', 'done'];

export default function TaskCard({ task, members, myRole, onStatusChange, onDelete, onRefresh }: TaskCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';

  const initials = task.assignee?.full_name
    ? task.assignee.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : null;

  return (
    <>
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-500 transition group">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-medium text-white leading-snug flex-1">{task.title}</p>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
            <button onClick={() => setShowEdit(true)}
              className="text-gray-500 hover:text-blue-400 transition p-0.5 rounded">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            {myRole === 'admin' && (
              <button onClick={() => onDelete(task.id)}
                className="text-gray-500 hover:text-red-400 transition p-0.5 rounded">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={task.priority} />

          {task.due_date && (
            <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
              <CalendarDays className="w-3 h-3" />
              {task.due_date}
            </span>
          )}

          {initials && (
            <div className="ml-auto w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              title={task.assignee?.full_name ?? ''}>
              {initials}
            </div>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-gray-700">
          <select
            value={task.status}
            onChange={e => onStatusChange(task.id, e.target.value as TaskStatus)}
            className="w-full bg-gray-700 border border-gray-600 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500 transition"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : 'Done'}</option>
            ))}
          </select>
        </div>
      </div>

      {showEdit && (
        <EditTaskModal
          task={task}
          members={members}
          onClose={() => setShowEdit(false)}
          onUpdated={onRefresh}
        />
      )}
    </>
  );
}
