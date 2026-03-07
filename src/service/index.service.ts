import type {
  Mix,
  MixIndexEntry,
  Task,
  TaskIndexEntry,
} from '../domain/types.js';
import type { IndexRepository } from '../repository/index.repo.js';
import type { MixRepository } from '../repository/mix.repo.js';
import type { ProjectRepository } from '../repository/project.repo.js';
import type { TaskRepository } from '../repository/task.repo.js';

export interface IndexService {
  updateTask(task: Task): Promise<void>;
  updateMix(mix: Mix): Promise<void>;
  removeTask(projectSlug: string, id: number): Promise<void>;
  removeMix(projectSlug: string, id: number): Promise<void>;
  rebuild(): Promise<void>;
}

function toTaskIndexEntry(task: Task): TaskIndexEntry {
  return {
    id: task.id,
    project: task.projectSlug,
    title: task.title,
    status: task.status,
    priority: task.priority,
    due: task.dueDate,
    path: `projects/${task.projectSlug}/task-${task.id}.md`,
  };
}

function toMixIndexEntry(mix: Mix): MixIndexEntry {
  return {
    id: mix.id,
    project: mix.projectSlug,
    title: mix.title,
    status: mix.status,
    path: `projects/${mix.projectSlug}/mix-${mix.id}.md`,
  };
}

function sortTaskEntries(a: TaskIndexEntry, b: TaskIndexEntry): number {
  if (a.project !== b.project) {
    return a.project.localeCompare(b.project);
  }

  return a.id - b.id;
}

function sortMixEntries(a: MixIndexEntry, b: MixIndexEntry): number {
  if (a.project !== b.project) {
    return a.project.localeCompare(b.project);
  }

  return a.id - b.id;
}

export class DefaultIndexService implements IndexService {
  private readonly indexRepository: IndexRepository;
  private readonly projectRepository: ProjectRepository;
  private readonly taskRepository: TaskRepository;
  private readonly mixRepository: MixRepository;

  constructor(
    indexRepository: IndexRepository,
    projectRepository: ProjectRepository,
    taskRepository: TaskRepository,
    mixRepository: MixRepository
  ) {
    this.indexRepository = indexRepository;
    this.projectRepository = projectRepository;
    this.taskRepository = taskRepository;
    this.mixRepository = mixRepository;
  }

  async updateTask(task: Task): Promise<void> {
    const index = await this.indexRepository.load();
    const nextTasks = index.tasks
      .filter(
        (entry) => !(entry.project === task.projectSlug && entry.id === task.id)
      )
      .concat(toTaskIndexEntry(task))
      .sort(sortTaskEntries);

    await this.indexRepository.save({
      ...index,
      tasks: nextTasks,
    });
  }

  async updateMix(mix: Mix): Promise<void> {
    const index = await this.indexRepository.load();
    const nextMixes = index.mixes
      .filter(
        (entry) => !(entry.project === mix.projectSlug && entry.id === mix.id)
      )
      .concat(toMixIndexEntry(mix))
      .sort(sortMixEntries);

    await this.indexRepository.save({
      ...index,
      mixes: nextMixes,
    });
  }

  async removeTask(projectSlug: string, id: number): Promise<void> {
    const index = await this.indexRepository.load();
    const nextTasks = index.tasks.filter(
      (entry) => !(entry.project === projectSlug && entry.id === id)
    );

    await this.indexRepository.save({
      ...index,
      tasks: nextTasks,
    });
  }

  async removeMix(projectSlug: string, id: number): Promise<void> {
    const index = await this.indexRepository.load();
    const nextMixes = index.mixes.filter(
      (entry) => !(entry.project === projectSlug && entry.id === id)
    );

    await this.indexRepository.save({
      ...index,
      mixes: nextMixes,
    });
  }

  async rebuild(): Promise<void> {
    const projects = await this.projectRepository.findAll();
    const tasks: TaskIndexEntry[] = [];
    const mixes: MixIndexEntry[] = [];

    for (const project of projects) {
      const [projectTasks, projectMixes] = await Promise.all([
        this.taskRepository.findAll(project.slug),
        this.mixRepository.findAll(project.slug),
      ]);

      tasks.push(...projectTasks.map(toTaskIndexEntry));
      mixes.push(...projectMixes.map(toMixIndexEntry));
    }

    await this.indexRepository.save({
      tasks: tasks.sort(sortTaskEntries),
      mixes: mixes.sort(sortMixEntries),
    });
  }
}
