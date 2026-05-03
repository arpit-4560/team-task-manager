import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Task {
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assignee?: string | null;
}

interface AIInsightsProps {
  tasks: Task[];
  projectName?: string;
}

interface Insight {
  type: 'risk' | 'suggestion' | 'praise' | 'priority';
  text: string;
}

const TYPE_STYLE: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  risk:       { bg: 'bg-red-900/20',    border: 'border-red-800/50',    icon: '⚠️', label: 'Risk'       },
  suggestion: { bg: 'bg-blue-900/20',   border: 'border-blue-800/50',   icon: '💡', label: 'Suggestion' },
  praise:     { bg: 'bg-green-900/20',  border: 'border-green-800/50',  icon: '✅', label: 'Great Work'  },
  priority:   { bg: 'bg-yellow-900/20', border: 'border-yellow-800/50', icon: '🎯', label: 'Priority'    },
};

export default function AIInsights({ tasks, projectName }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [generated, setGenerated] = useState(false);

  async function generateInsights() {
    if (tasks.length === 0) return;
    setLoading(true);
    setError('');

    const today = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done');
    const done = tasks.filter(t => t.status === 'done');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'done');

    const prompt = `You are a project management AI assistant. Analyze this project data and return a JSON array of 4-6 actionable insights.

Project: ${projectName || 'Team Project'}
Today: ${today}
Total tasks: ${tasks.length}
Done: ${done.length}
In Progress: ${inProgress.length}
Overdue: ${overdue.length}
High priority pending: ${highPriority.length}

Tasks summary:
${tasks.slice(0, 20).map(t => `- "${t.title}" [${t.status}] priority:${t.priority} due:${t.due_date || 'none'} assignee:${t.assignee || 'unassigned'}`).join('\n')}

Return ONLY a JSON array like:
[
  {"type": "risk", "text": "..."},
  {"type": "suggestion", "text": "..."},
  {"type": "praise", "text": "..."},
  {"type": "priority", "text": "..."}
]

Types: "risk" (problems/blockers), "suggestion" (improvements), "praise" (what's going well), "priority" (what to focus on next).
Each insight must be specific, concise (1-2 sentences), and actionable. No generic advice.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.map((c: any) => c.text || '').join('') || '';
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed: Insight[] = JSON.parse(cleaned);
      setInsights(parsed);
      setGenerated(true);
      setExpanded(true);
    } catch (err) {
      setError('Could not generate insights. Please try again.');
    }

    setLoading(false);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          AI Task Insights
        </h2>
        <div className="flex items-center gap-2">
          {generated && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-gray-500 hover:text-white transition p-1"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={generateInsights}
            disabled={loading || tasks.length === 0}
            className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition font-medium"
          >
            {loading
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
              : generated
                ? <><RefreshCw className="w-3 h-3" /> Refresh</>
                : <><Sparkles className="w-3 h-3" /> Analyze</>
            }
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          {!generated && !loading && (
            <div className="text-center py-6">
              <Sparkles className="w-10 h-10 text-purple-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-1">Get AI-powered insights for your project</p>
              <p className="text-xs text-gray-600">Analyzes task load, risks, overdue items, and team performance</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              <span className="text-sm text-gray-400">Analyzing your project...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {insights.length > 0 && !loading && (
            <div className="space-y-3">
              {insights.map((ins, i) => {
                const style = TYPE_STYLE[ins.type] || TYPE_STYLE.suggestion;
                return (
                  <div key={i} className={`${style.bg} border ${style.border} rounded-lg px-4 py-3 flex items-start gap-3`}>
                    <span className="text-base flex-shrink-0 mt-0.5">{style.icon}</span>
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{style.label}</span>
                      <p className="text-sm text-gray-200 mt-0.5 leading-relaxed">{ins.text}</p>
                    </div>
                  </div>
                );
              })}
              <p className="text-[11px] text-gray-600 text-right pt-1">Powered by Claude AI</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
