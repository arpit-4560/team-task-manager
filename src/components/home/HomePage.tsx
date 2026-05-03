import { useState } from 'react';
import { CheckSquare, Zap, Users, BarChart2, Shield, ArrowRight, Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface HomePageProps {
  onGetStarted: () => void;
}

export default function HomePage({ onGetStarted }: HomePageProps) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  const features = [
    { icon: CheckSquare, title: 'Task Management', desc: 'Create, assign, and track tasks with priorities, due dates, and status updates in real time.', color: 'text-blue-400', bg: dark ? 'bg-blue-900/20' : 'bg-blue-50' },
    { icon: Users, title: 'Team Collaboration', desc: 'Invite members with role-based access — Admin, Manager, or Member — for the right level of control.', color: 'text-purple-400', bg: dark ? 'bg-purple-900/20' : 'bg-purple-50' },
    { icon: Zap, title: 'Real-time Updates', desc: 'See task changes and notifications instantly across your entire team without refreshing.', color: 'text-yellow-400', bg: dark ? 'bg-yellow-900/20' : 'bg-yellow-50' },
    { icon: BarChart2, title: 'Analytics Dashboard', desc: 'Track completion rates, team workload, and project progress with beautiful visual charts.', color: 'text-green-400', bg: dark ? 'bg-green-900/20' : 'bg-green-50' },
    { icon: Shield, title: 'Role-Based Access', desc: 'Three-tier permission system ensures everyone sees and does exactly what they should.', color: 'text-red-400', bg: dark ? 'bg-red-900/20' : 'bg-red-50' },
    { icon: CheckSquare, title: 'AI Insights', desc: 'Claude AI analyzes your project and gives actionable suggestions, risks, and priorities.', color: 'text-pink-400', bg: dark ? 'bg-pink-900/20' : 'bg-pink-50' },
  ];

  const stats = [
    { value: '3', label: 'Role Levels' },
    { value: '∞', label: 'Projects' },
    { value: 'AI', label: 'Powered Insights' },
    { value: 'PWA', label: 'Mobile Ready' },
  ];

  const steps = [
    { num: '01', title: 'Create a project', desc: 'Set up your workspace and invite your team members.' },
    { num: '02', title: 'Add tasks', desc: 'Break your project into tasks with priorities and due dates.' },
    { num: '03', title: 'Track progress', desc: 'Monitor real-time updates, analytics, and AI insights.' },
  ];

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'} transition-colors duration-300`}>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${dark ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b backdrop-blur-md`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">TaskFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme}
              className={`p-2 rounded-lg transition ${dark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10 ${dark ? 'bg-blue-500' : 'bg-blue-400'}`} />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-6 ${dark ? 'bg-blue-900/40 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
            <Zap className="w-3 h-3" /> Now with AI-powered insights
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Manage your team's work{' '}
            <span className="text-blue-500">effortlessly</span>
          </h1>

          <p className={`text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
            TaskFlow brings your projects, tasks, and team together in one beautiful workspace — with real-time updates, AI insights, and role-based access control.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
              Start for free <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={onGetStarted}
              className={`px-8 py-3.5 rounded-xl font-semibold text-base transition border ${dark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={`py-12 border-y ${dark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-1">{s.value}</div>
              <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything your team needs</h2>
            <p className={`text-lg ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Powerful features built for modern teams</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className={`p-6 rounded-2xl border transition hover:scale-[1.02] ${dark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}>
                <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className={`text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`py-20 px-6 ${dark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className={`text-lg ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Get your team up and running in minutes</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className={`hidden sm:block absolute top-6 left-[60%] w-[80%] h-px ${dark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                )}
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm mx-auto mb-4 relative z-10">
                  {s.num}
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className={`text-lg mb-8 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
            Join your team on TaskFlow — free to use, no credit card required.
          </p>
          <button onClick={onGetStarted}
            className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-semibold text-base transition shadow-lg shadow-blue-500/25 flex items-center gap-2 mx-auto">
            Get started for free <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-8 px-6 text-center text-sm ${dark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
        <p>Built with ❤️ by <span className="text-blue-400 font-medium">Arpit Singh</span> · TaskFlow {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
