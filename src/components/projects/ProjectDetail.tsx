import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Plus, Users, Settings, Trash2, UserPlus, Loader2, MoreVertical } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import TaskCard from '../tasks/TaskCard';
import CreateTaskModal from '../tasks/CreateTaskModal';
import type { Project, ProjectMemberWithProfile, Task, Profile, TaskStatus } from '../../lib/database.types';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

const STATUS_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

export default function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMemberWithProfile[]>([]);
  const [tasks, setTasks] = useState<(Task & { assignee: Profile | null })[]>([]);
  const [myRole, setMyRole] = useState<'admin' | 'member' | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'board' | 'members'>('board');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, [projectId]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadProject(), loadMembers(), loadTasks()]);
    setLoading(false);
  }

  async function loadProject() {
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
    if (data) { setProject(data); setEditName(data.name); setEditDesc(data.description); }
  }

  async function loadMembers() {
    const { data } = await supabase
      .from('project_members')
      .select('*, profiles(*)')
      .eq('project_id', projectId);
    if (data) {
      setMembers(data as ProjectMemberWithProfile[]);
      const me = data.find(m => m.user_id === user?.id);
      setMyRole(me?.role ?? null);
    }
  }

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assignee_id_fkey(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setTasks((data ?? []) as (Task & { assignee: Profile | null })[]);
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviting(true);

const rpcResult = await (supabase.rpc as any)('get_user_id_by_email', { email: inviteEmail });
const userId = rpcResult?.data;
const rpcError = rpcResult?.error;

if (rpcError || !userId) {
  setInviteError('User not found. Make sure they have signed up.');
  setInviting(false);
  return;
}
    const { error } = await supabase.from('project_members').insert({
      project_id: projectId,
      user_id: userId,
      role: inviteRole,
    });

    if (error) {
      setInviteError(error.code === '23505' ? 'User is already a member.' : error.message);
    } else {
      setInviteEmail('');
      setShowAddMember(false);
      loadMembers();
    }
    setInviting(false);
  }

  async function removeMember(memberId: string) {
    await supabase.from('project_members').delete().eq('id', memberId);
    loadMembers();
  }

  async function updateMemberRole(memberId: string, role: 'admin' | 'member') {
    await supabase.from('project_members').update({ role }).eq('id', memberId);
    loadMembers();
  }

  async function saveProjectSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('projects').update({ name: editName.trim(), description: editDesc.trim() }).eq('id', projectId);
    setSaving(false);
    setShowSettings(false);
    loadProject();
  }

  async function archiveProject() {
    await supabase.from('projects').update({ status: project?.status === 'active' ? 'archived' : 'active' }).eq('id', projectId);
    loadProject();
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    loadTasks();
  }

  async function deleteTask(taskId: string) {
    await supabase.from('tasks').delete().eq('id', taskId);
    loadTasks();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return <div className="text-gray-400 text-center py-16">Project not found.</div>;

  const tasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button onClick={onBack} className="mt-0.5 text-gray-400 hover:text-white transition flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white truncate">{project.name}</h1>
              <Badge variant={project.status} />
            </div>
            {project.description && <p className="text-gray-400 text-sm mt-1">{project.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {myRole === 'admin' && (
            <button onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          )}
          {myRole && (
            <button onClick={() => setShowCreateTask(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg w-fit">
        {(['board', 'members'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition capitalize ${
              activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {tab === 'members' ? <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Members ({members.length})</span> : 'Board'}
          </button>
        ))}
      </div>

      {/* Board */}
      {activeTab === 'board' && (
        <div className="grid md:grid-cols-3 gap-4 items-start">
          {STATUS_COLUMNS.map(({ status, label }) => (
            <div key={status} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300">{label}</h3>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{tasksByStatus(status).length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-[120px]">
                {tasksByStatus(status).length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-4">No tasks</p>
                ) : (
                  tasksByStatus(status).map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      members={members}
                      myRole={myRole}
                      onStatusChange={updateTaskStatus}
                      onDelete={deleteTask}
                      onRefresh={loadTasks}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      {activeTab === 'members' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">Team Members</h2>
            {myRole === 'admin' && (
              <button onClick={() => setShowAddMember(true)}
                className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition">
                <UserPlus className="w-4 h-4" /> Add Member
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-800">
            {members.map(member => {
              const isMe = member.user_id === user?.id;
              const isOwner = project.owner_id === member.user_id;
              const initials = member.profiles?.full_name
                ? member.profiles.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : '?';
              return (
                <div key={member.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {member.profiles?.full_name || 'Unknown'}
                      {isMe && <span className="text-gray-500 font-normal ml-1">(you)</span>}
                    </p>
                    {isOwner && <p className="text-xs text-gray-500">Project owner</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {myRole === 'admin' && !isMe ? (
                      <select
                        value={member.role}
                        onChange={e => updateMemberRole(member.id, e.target.value as 'admin' | 'member')}
                        className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <Badge variant={member.role} />
                    )}
                    {myRole === 'admin' && !isOwner && !isMe && (
                      <button onClick={() => removeMember(member.id)}
                        className="text-gray-500 hover:text-red-400 transition p-1 rounded hover:bg-red-900/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={projectId}
          members={members}
          onClose={() => setShowCreateTask(false)}
          onCreated={loadTasks}
        />
      )}

      {/* Add Member Modal */}
      <Modal open={showAddMember} onClose={() => { setShowAddMember(false); setInviteEmail(''); setInviteError(''); }} title="Add Member">
        <form onSubmit={inviteMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">User ID or email lookup</label>
            <p className="text-xs text-gray-500 mb-2">Enter the user's email address to add them.</p>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as 'admin' | 'member')}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {inviteError && <p className="text-red-400 text-sm">{inviteError}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddMember(false)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-lg transition">Cancel</button>
            <button type="submit" disabled={inviting}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
              {inviting && <Loader2 className="w-4 h-4 animate-spin" />} Add Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Settings Modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Project Settings">
        <form onSubmit={saveProjectSettings} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Project name</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowSettings(false)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-lg transition">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
            </button>
          </div>
          <hr className="border-gray-800" />
          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Danger Zone</p>
            <button type="button" onClick={archiveProject}
              className="text-sm text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 px-3 py-2 rounded-lg transition w-full text-left">
              {project.status === 'active' ? 'Archive this project' : 'Restore this project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
