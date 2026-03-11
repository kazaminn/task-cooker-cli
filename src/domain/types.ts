export type TaskStatus = 'order' | 'prep' | 'cook' | 'serve';
export type MixStatus = 'open' | 'closed';
export type ProjectStatus = 'planning' | 'cooking' | 'on_hold' | 'completed';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Subtask {
  title: string;
  done: boolean;
  children: Subtask[];
}

export interface Task {
  id: number;
  projectSlug: string;
  path?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  subtasks: Subtask[];
  linkedIssueIds: number[];
}

export interface MixComment {
  author: string;
  timestamp: string;
  body: string;
}

export interface Mix {
  id: number;
  projectSlug: string;
  title: string;
  status: MixStatus;
  comments: MixComment[];
}

export interface Project {
  slug: string;
  name: string;
  overview: string;
}

export type ActivityType =
  | 'task_create'
  | 'task_update'
  | 'task_delete'
  | 'mix_create'
  | 'mix_post_create'
  | 'mix_delete'
  | 'project_create'
  | 'project_update'
  | 'project_delete';

export interface Activity {
  time: string;
  type: ActivityType;
  projectId: string;
  taskId?: number;
  mixId?: number;
  text: string;
}

export interface TckConfig {
  user: {
    name: string;
    email: string;
  };
  defaultProject: string;
  editor: string;
  dateFormat: string;
  language: 'ja' | 'en';
}

export interface Counter {
  task: number;
  mix: number;
  project: number;
}

export interface TaskIndexEntry {
  id: number;
  project: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due?: string;
  path: string;
}

export interface MixIndexEntry {
  id: number;
  project: string;
  title: string;
  status: MixStatus;
  path: string;
}

export interface TckIndex {
  tasks: TaskIndexEntry[];
  mixes: MixIndexEntry[];
}

export interface Tag {
  name: string;
  value?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectSlug?: string;
  dueDate?: string;
  sortBy?: 'status' | 'priority' | 'due' | 'created' | 'updated';
}
