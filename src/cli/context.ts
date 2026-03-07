import {
  FileActivityRepository,
  FileConfigRepository,
  FileCounterRepository,
  FileIndexRepository,
  FileMixRepository,
  FileProjectRepository,
  FileTaskRepository,
} from '../index.js';
import {
  DefaultActivityService,
  DefaultIndexService,
  DefaultMixService,
  DefaultProjectService,
  DefaultTaskService,
} from '../index.js';

export interface CliContext {
  readonly activityRepository: FileActivityRepository;
  readonly configRepository: FileConfigRepository;
  readonly counterRepository: FileCounterRepository;
  readonly indexRepository: FileIndexRepository;
  readonly mixRepository: FileMixRepository;
  readonly projectRepository: FileProjectRepository;
  readonly taskRepository: FileTaskRepository;
  readonly activityService: DefaultActivityService;
  readonly indexService: DefaultIndexService;
  readonly mixService: DefaultMixService;
  readonly projectService: DefaultProjectService;
  readonly taskService: DefaultTaskService;
}

export function createCliContext(startDir?: string): CliContext {
  const activityRepository = new FileActivityRepository(startDir);
  const configRepository = new FileConfigRepository(startDir);
  const counterRepository = new FileCounterRepository(startDir);
  const indexRepository = new FileIndexRepository(startDir);
  const mixRepository = new FileMixRepository(startDir);
  const projectRepository = new FileProjectRepository(startDir);
  const taskRepository = new FileTaskRepository(startDir);

  const indexService = new DefaultIndexService(
    indexRepository,
    projectRepository,
    taskRepository,
    mixRepository
  );

  const activityService = new DefaultActivityService(activityRepository);
  const projectService = new DefaultProjectService(
    projectRepository,
    counterRepository,
    indexService
  );
  const taskService = new DefaultTaskService(
    taskRepository,
    counterRepository,
    indexRepository,
    indexService
  );
  const mixService = new DefaultMixService(
    mixRepository,
    counterRepository,
    indexRepository,
    indexService
  );

  return {
    activityRepository,
    configRepository,
    counterRepository,
    indexRepository,
    mixRepository,
    projectRepository,
    taskRepository,
    activityService,
    indexService,
    mixService,
    projectService,
    taskService,
  };
}
