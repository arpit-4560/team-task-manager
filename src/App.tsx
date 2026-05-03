import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import ProjectList from './components/projects/ProjectList';
import ProjectDetail from './components/projects/ProjectDetail';
import MyTasks from './components/tasks/MyTasks';
import ProfilePage from './components/profile/ProfilePage';
import InstallPrompt from './components/ui/InstallPrompt';
import Analytics from './components/analytics/Analytics';

type View = 'dashboard' | 'projects' | 'project' | 'my-tasks' | 'profile' | 'analytics';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  function handleNavigate(v: string, id?: string) {
    setView(v as View);
    if (id) setSelectedProjectId(id);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar currentView={view} onNavigate={handleNavigate} />

      <main className="flex-1 lg:ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pt-20 lg:pt-8">
          {view === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {view === 'projects' && <ProjectList onNavigate={handleNavigate} />}
          {view === 'project' && selectedProjectId && (
            <ProjectDetail
              projectId={selectedProjectId}
              onBack={() => setView('projects')}
            />
          )}
          {view === 'my-tasks' && <MyTasks onNavigate={handleNavigate} />}
          {view === 'profile' && <ProfilePage />}
          {view === 'analytics' && <Analytics />}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <InstallPrompt />
    </AuthProvider>
  );
}

export default App;
