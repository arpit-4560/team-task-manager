export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          owner_id: string;
          status: 'active' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          owner_id: string;
          status?: 'active' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          owner_id?: string;
          status?: 'active' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: 'admin' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string;
          status: 'todo' | 'in_progress' | 'done';
          priority: 'low' | 'medium' | 'high';
          assignee_id: string | null;
          created_by: string;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string;
          status?: 'todo' | 'in_progress' | 'done';
          priority?: 'low' | 'medium' | 'high';
          assignee_id?: string | null;
          created_by: string;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string;
          status?: 'todo' | 'in_progress' | 'done';
          priority?: 'low' | 'medium' | 'high';
          assignee_id?: string | null;
          created_by?: string;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectMember = Database['public']['Tables']['project_members']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];

export interface TaskAttachment {
  id: string;
  task_id: string;
  uploaded_by: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  created_at: string;
  uploader?: Profile;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type MemberRole = 'admin' | 'manager' | 'member';

export interface Notification {
  id: string;
  user_id: string;
  type: 'task_assigned' | 'task_overdue' | 'task_done' | 'member_added' | 'comment';
  title: string;
  message: string;
  read: boolean;
  link_project_id: string | null;
  link_task_id: string | null;
  created_at: string;
}

export interface ProjectMemberWithProfile extends ProjectMember {
  profiles: Profile;
}

export interface TaskWithDetails extends Task {
  assignee: Profile | null;
  creator: Profile;
}
