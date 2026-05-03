interface BadgeProps {
  variant: 'todo' | 'in_progress' | 'done' | 'low' | 'medium' | 'high' | 'admin' | 'manager' | 'member' | 'active' | 'archived';
  label?: string;
}

const styles: Record<BadgeProps['variant'], string> = {
  todo: 'bg-gray-700 text-gray-300',
  in_progress: 'bg-blue-900/50 text-blue-300 border border-blue-800',
  done: 'bg-green-900/50 text-green-300 border border-green-800',
  low: 'bg-gray-700 text-gray-300',
  medium: 'bg-yellow-900/50 text-yellow-300 border border-yellow-800',
  high: 'bg-red-900/50 text-red-300 border border-red-800',
  admin: 'bg-purple-900/50 text-purple-300 border border-purple-800',
  manager: 'bg-blue-900/50 text-blue-300 border border-blue-800',
  member: 'bg-gray-700 text-gray-300',
  active: 'bg-green-900/50 text-green-300 border border-green-800',
  archived: 'bg-gray-700 text-gray-400',
};

const labels: Record<BadgeProps['variant'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
  active: 'Active',
  archived: 'Archived',
};

export default function Badge({ variant, label }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant] ?? styles.member}`}>
      {label ?? labels[variant]}
    </span>
  );
}
