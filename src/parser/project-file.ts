import matter from 'gray-matter';

export interface ParsedProjectFile {
  metadata: Record<string, unknown>;
  body: string;
}

export function parseProjectFile(input: string): ParsedProjectFile {
  const { data, content } = matter(input);

  return {
    metadata: data as Record<string, unknown>,
    body: content.replace(/^\n+/, '').trimEnd(),
  };
}

export function formatProjectFile(parsed: ParsedProjectFile): string {
  return matter.stringify(
    '\n' + (parsed.body ? parsed.body : ''),
    parsed.metadata
  );
}
