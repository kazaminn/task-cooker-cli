import { z } from 'zod';

import type { Subtask } from './types.js';

// --- Primitive schemas ---

export const TaskStatusSchema = z.enum(['order', 'prep', 'cook', 'serve']);
export const TaskPrioritySchema = z.enum(['urgent', 'high', 'medium', 'low']);
export const MixStatusSchema = z.enum(['open', 'closed']);
export const ProjectStatusSchema = z.enum([
  'planning',
  'cooking',
  'on_hold',
  'completed',
]);

/** YYYY-MM-DD */
export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)');

/** ISO 8601 timestamp (loose match) */
export const TimestampSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Invalid timestamp format');

// --- Recursive Subtask ---

export const SubtaskSchema: z.ZodType<Subtask> = z.lazy(() =>
  z.object({
    title: z.string(),
    done: z.boolean(),
    children: z.array(SubtaskSchema),
  })
);

// --- Task metadata (raw key-value from issue-file parser) ---

export const TaskMetadataSchema = z.object({
  ID: z.string().regex(/^\d+$/, 'ID must be a non-negative integer string'),
  Project: z.string().min(1),
  Title: z.string().min(1),
  Status: TaskStatusSchema,
  Priority: TaskPrioritySchema,
  Due: DateStringSchema.optional(),
  Linked: z.string().optional(),
});

// --- Domain objects ---

export const TaskSchema = z.object({
  id: z.number().int().positive(),
  projectSlug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  dueDate: DateStringSchema.optional(),
  subtasks: z.array(SubtaskSchema),
  linkedIssueIds: z.array(z.number().int().positive()),
});

export const MixCommentSchema = z.object({
  author: z.string().min(1),
  timestamp: TimestampSchema,
  body: z.string(),
});

export const MixSchema = z.object({
  id: z.number().int().positive(),
  projectSlug: z.string().min(1),
  title: z.string().min(1),
  status: MixStatusSchema,
  comments: z.array(MixCommentSchema),
});

// --- Config ---

export const TckConfigSchema = z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  defaultProject: z.string(),
  editor: z.string(),
  dateFormat: z.string(),
  language: z.enum(['ja', 'en']),
});

// --- Counter ---

export const CounterSchema = z.object({
  task: z.number().int().nonnegative(),
  mix: z.number().int().nonnegative(),
  project: z.number().int().nonnegative(),
});

// --- Index entries ---

export const TaskIndexEntrySchema = z.object({
  id: z.number().int().positive(),
  project: z.string().min(1),
  title: z.string().min(1),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  due: DateStringSchema.optional(),
  path: z.string().min(1),
});

export const MixIndexEntrySchema = z.object({
  id: z.number().int().positive(),
  project: z.string().min(1),
  title: z.string().min(1),
  status: MixStatusSchema,
  path: z.string().min(1),
});

export const TckIndexSchema = z.object({
  tasks: z.array(TaskIndexEntrySchema),
  mixes: z.array(MixIndexEntrySchema),
});
