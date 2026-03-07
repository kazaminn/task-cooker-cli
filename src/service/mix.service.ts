import { NotFoundError, ValidationError } from '../domain/errors.js';
import type { Mix, MixComment, MixStatus } from '../domain/types.js';
import type { CounterRepository } from '../repository/counter.repo.js';
import type { IndexRepository } from '../repository/index.repo.js';
import type { MixRepository } from '../repository/mix.repo.js';
import type { IndexService } from './index.service.js';

export interface CreateMixInput {
  projectSlug: string;
  title: string;
  status?: MixStatus;
  comments?: MixComment[];
}

export interface UpdateMixInput {
  projectSlug: string;
  title?: string;
  status?: MixStatus;
}

export interface MixFilter {
  projectSlug?: string;
  status?: MixStatus;
}

export interface AddMixCommentInput {
  author: string;
  body: string;
  timestamp?: string;
}

export interface MixService {
  create(input: CreateMixInput): Promise<Mix>;
  update(id: number, input: UpdateMixInput): Promise<Mix>;
  close(id: number, projectSlug: string): Promise<Mix>;
  reopen(id: number, projectSlug: string): Promise<Mix>;
  addComment(
    id: number,
    projectSlug: string,
    input: AddMixCommentInput
  ): Promise<Mix>;
  getById(id: number, projectSlug: string): Promise<Mix>;
  delete(projectSlug: string, id: number): Promise<void>;
  list(filter?: MixFilter): Promise<Mix[]>;
}

export class DefaultMixService implements MixService {
  private readonly mixRepository: MixRepository;
  private readonly counterRepository: CounterRepository;
  private readonly indexRepository: IndexRepository;
  private readonly indexService: IndexService;

  constructor(
    mixRepository: MixRepository,
    counterRepository: CounterRepository,
    indexRepository: IndexRepository,
    indexService: IndexService
  ) {
    this.mixRepository = mixRepository;
    this.counterRepository = counterRepository;
    this.indexRepository = indexRepository;
    this.indexService = indexService;
  }

  async create(input: CreateMixInput): Promise<Mix> {
    const id = await this.counterRepository.next('mix');

    const mix: Mix = {
      id,
      projectSlug: input.projectSlug,
      title: input.title,
      status: input.status ?? 'open',
      comments: input.comments ?? [],
    };

    await this.mixRepository.save(mix);
    await this.indexService.updateMix(mix);
    return mix;
  }

  async update(id: number, input: UpdateMixInput): Promise<Mix> {
    const mix = await this.mixRepository.findById(input.projectSlug, id);
    if (!mix) {
      throw new NotFoundError('mix', id);
    }

    const next: Mix = {
      ...mix,
      title: input.title ?? mix.title,
      status: input.status ?? mix.status,
    };

    await this.mixRepository.save(next);
    await this.indexService.updateMix(next);
    return next;
  }

  async close(id: number, projectSlug: string): Promise<Mix> {
    return this.update(id, { projectSlug, status: 'closed' });
  }

  async reopen(id: number, projectSlug: string): Promise<Mix> {
    return this.update(id, { projectSlug, status: 'open' });
  }

  async addComment(
    id: number,
    projectSlug: string,
    input: AddMixCommentInput
  ): Promise<Mix> {
    if (!input.body.trim()) {
      throw new ValidationError('コメント本文が空です。');
    }

    const mix = await this.mixRepository.findById(projectSlug, id);
    if (!mix) {
      throw new NotFoundError('mix', id);
    }

    const comment: MixComment = {
      author: input.author,
      body: input.body,
      timestamp: input.timestamp ?? new Date().toISOString(),
    };

    const next: Mix = {
      ...mix,
      comments: [...mix.comments, comment],
    };

    await this.mixRepository.save(next);
    await this.indexService.updateMix(next);
    return next;
  }

  async getById(id: number, projectSlug: string): Promise<Mix> {
    const mix = await this.mixRepository.findById(projectSlug, id);
    if (!mix) {
      throw new NotFoundError('mix', id);
    }

    return mix;
  }

  async delete(projectSlug: string, id: number): Promise<void> {
    const mix = await this.mixRepository.findById(projectSlug, id);
    if (!mix) {
      throw new NotFoundError('mix', id);
    }

    await this.mixRepository.remove(projectSlug, id);
    await this.indexService.removeMix(projectSlug, id);
  }

  async list(filter?: MixFilter): Promise<Mix[]> {
    const index = await this.indexRepository.load();
    const entries = index.mixes.filter((entry) => {
      if (filter?.projectSlug && entry.project !== filter.projectSlug) {
        return false;
      }

      if (filter?.status && entry.status !== filter.status) {
        return false;
      }

      return true;
    });

    const mixes = await Promise.all(
      entries.map((entry) =>
        this.mixRepository.findById(entry.project, entry.id)
      )
    );

    return mixes
      .filter((mix): mix is Mix => mix !== null)
      .sort((a, b) => a.id - b.id);
  }
}
