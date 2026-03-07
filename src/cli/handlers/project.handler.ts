import { formatTable, toJson } from '../../util/format.js';
import { createCliContext } from '../context.js';
import { getTranslator, requireForce } from './shared.js';

export interface ProjectCreateOptions {
  slug?: string;
  json?: boolean;
}

export interface ProjectViewOptions {
  json?: boolean;
}

export interface ProjectDeleteOptions {
  force?: boolean;
  json?: boolean;
}

export async function projectListHandler(options: {
  json?: boolean;
}): Promise<void> {
  const context = createCliContext();
  const projects = await context.projectService.list();

  if (options.json) {
    console.log(toJson(projects));
    return;
  }

  console.log(
    formatTable(
      ['Slug', 'Name', 'Overview'],
      projects.map((project) => [project.slug, project.name, project.overview])
    )
  );
}

export async function projectCreateHandler(
  name: string,
  options: ProjectCreateOptions
): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  const project = await context.projectService.create({
    name,
    slug: options.slug,
  });
  await context.activityService.log({
    type: 'project_create',
    projectId: project.slug,
    text: t('activityProjectCreated', { name: project.name }),
  });

  if (options.json) {
    console.log(toJson(project));
    return;
  }

  console.log(t('projectCreated', { slug: project.slug }));
}

export async function projectViewHandler(
  slug: string,
  options: ProjectViewOptions
): Promise<void> {
  const context = createCliContext();
  const project = await context.projectService.getBySlug(slug);

  if (options.json) {
    console.log(toJson(project));
    return;
  }

  console.log(`Slug: ${project.slug}`);
  console.log(`Name: ${project.name}`);
  console.log('');
  console.log(project.overview);
}

export async function projectDeleteHandler(
  slug: string,
  options: ProjectDeleteOptions
): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  await requireForce(context, options.force);
  await context.projectService.delete(slug);
  await context.activityService.log({
    type: 'project_delete',
    projectId: slug,
    text: t('activityProjectDeleted', { slug }),
  });

  if (options.json) {
    console.log(toJson({ ok: true, slug }));
    return;
  }

  console.log(t('projectDeleted', { slug }));
}
