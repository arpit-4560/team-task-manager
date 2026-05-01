import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, FolderKanban, Users, CheckSquare, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import type { Project } from '../../lib/database.types';

interface ProjectListProps {
  onNavigate: (view: string, id?: string) => void;
}

interface ProjectWithStats extends Project {
  member_count: number;
  task_count: number;
  my_role: 'admin' | 'member';
}

export default function ProjectList({ onNavigate }: ProjectListProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  async function loadProjects() {
    setLoading(true);
    const { data: memberships } = await supabase
      .from('project_members')
      .select('project_id, role, projects(*, project_members(count), tasks(count))')
      .eq('user_id', user!.id);

    if (memberships) {
      const list = memberships.map((m: any) => ({
        ...m.projects,
        my_role: m.role,
        member_count: m.projects.project_members?.[0]?.count ?? 0,
        task_count: m.projects.tasks?.[0]?.count ?? 0,
      }));
      list.sort((a: ProjectWithStats, b: ProjectWithStats) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setProjects(list);
    }
    setLoading(false);
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError('Project name is required.'); return; }
    setCreating(true);
    setFormError('');

    const { data: project, error } = await supabase
      .from('projects')
      .insert({ name: name.trim(), description: description.trim(), owner_id: user!.id })
      .select()
      .single();

    if (error || !project) {
      setFormError('Failed to create project.');
      setCreating(false);
      return;
    }

    await supabase.from('project_members').insert({ project_id: project.id, user_id: user!.id, role: 'admin' });

    setShowCreate(false);
    setName('');
    setDescription('');
    setCreating(false);
    loadProjects();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Projects</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <FolderKanban className="w-7 h-7 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No projects yet</h3>
          <p className="text-gray-400 text-sm mb-5">Create your first project to start collaborating.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => onNavigate('project', project.id)}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 hover:bg-gray-800/50 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-900/40 border border-blue-800/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex gap-2">
                  <Badge variant={project.status} />
                  <Badge variant={project.my_role} />
                </div>
              </div>
              <h3 className="font-semibold text-white text-base group-hover:text-blue-300 transition truncate">{project.name}</h3>
              {project.description && (
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{project.member_count} members</span>
                <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5" />{project.task_count} tasks</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setFormError(''); setName(''); setDescription(''); }} title="New Project">
        <form onSubmit={createProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Project name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              required
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description <span className="text-gray-500 font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
            />
          </div>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-lg transition">
              Cancel
            </button>
            <button type="submit" disabled={creating}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
