import { NotFoundError, ValidationError } from '../domain/errors.js';
import type { Project } from '../domain/types.js';
import type { CounterRepository } from '../repository/counter.repo.js';
import type { ProjectRepository } from '../repository/project.repo.js';
import type { IndexService } from './index.service.js';

export interface CreateProjectInput {
  name: string;
  slug?: string;
  overview?: string;
}

export interface UpdateProjectInput {
  name?: string;
  overview?: string;
}

export interface ProjectService {
  create(input: CreateProjectInput): Promise<Project>;
  update(slug: string, input: UpdateProjectInput): Promise<Project>;
  getBySlug(slug: string): Promise<Project>;
  list(): Promise<Project[]>;
  delete(slug: string): Promise<void>;
}

export class DefaultProjectService implements ProjectService {
  private readonly projectRepository: ProjectRepository;
  private readonly counterRepository: CounterRepository;
  private readonly indexService?: IndexService;

  constructor(
    projectRepository: ProjectRepository,
    counterRepository: CounterRepository,
    indexService?: IndexService
  ) {
    this.projectRepository = projectRepository;
    this.counterRepository = counterRepository;
    this.indexService = indexService;
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const slug =
      input.slug ?? `project-${await this.counterRepository.next('project')}`;
    const existing = await this.projectRepository.findBySlug(slug);
    if (existing) {
      throw new ValidationError(`project slug is already used: ${slug}`);
    }

    const project: Project = {
      slug,
      name: input.name,
      overview: input.overview ?? '',
    };

    await this.projectRepository.save(project);
    return project;
  }

  async update(slug: string, input: UpdateProjectInput): Promise<Project> {
    const project = await this.projectRepository.findBySlug(slug);
    if (!project) {
      throw new NotFoundError('project', slug);
    }

    const next: Project = {
      ...project,
      name: input.name ?? project.name,
      overview: input.overview ?? project.overview,
    };

    await this.projectRepository.save(next);
    return next;
  }

  async getBySlug(slug: string): Promise<Project> {
    const project = await this.projectRepository.findBySlug(slug);
    if (!project) {
      throw new NotFoundError('project', slug);
    }

    return project;
  }

  async list(): Promise<Project[]> {
    return this.projectRepository.findAll();
  }

  async delete(slug: string): Promise<void> {
    const project = await this.projectRepository.findBySlug(slug);
    if (!project) {
      throw new NotFoundError('project', slug);
    }

    await this.projectRepository.remove(slug);
    if (this.indexService) {
      await this.indexService.rebuild();
    }
  }
}
