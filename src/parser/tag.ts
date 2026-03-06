import type { Tag } from '../domain/types.js';

export function parseTags(input: string): Tag[] {
  return input
    .split(',')
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((token) => {
      const matched = /^@?([\w-]+)(?:\((.*)\))?$/.exec(token);

      if (!matched) {
        return { name: token };
      }

      return {
        name: matched[1],
        value: matched[2],
      } satisfies Tag;
    });
}

export function formatTags(tags: Tag[]): string {
  return tags
    .map((tag) => (tag.value ? `@${tag.name}(${tag.value})` : `@${tag.name}`))
    .join(', ');
}
