import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import TaskAttachments from './TaskAttachments';
import type { Task, Profile, ProjectMemberWithProfile, TaskPriority, TaskStatus } from '../../lib/database.types';

interface EditTaskModalProps {
  task: Task & { assignee: Profile | null };
  members: ProjectMemberWithProfile[];
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditTaskModal({ task, members, onClose, onUpdated }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? '');
  const [dueDate, setDueDate] = useState(task.due_date ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');

    const { error: err } = await supabase.from('tasks').update({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
    }).eq('id', task.id);

    if (err) {
      setError(err.message);
    } else {
      onUpdated();
      onClose();
    }
    setSaving(false);
  }

  return (
    <Modal open={true} onClose={onClose} title="Edit Task" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition">
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Assignee</label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition">
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name || 'Unknown'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Due date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition" />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* File Attachments */}
        <TaskAttachments taskId={task.id} />

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-lg transition">Cancel</button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
