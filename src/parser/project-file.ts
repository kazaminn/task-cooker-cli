export interface ParsedProjectFile {
  metadata: Record<string, string>;
  body: string;
}

const SEPARATOR = '\n---\n';

export function parseProjectFile(input: string): ParsedProjectFile {
  const sepIndex = input.indexOf(SEPARATOR);
  const headerPart = sepIndex === -1 ? input : input.slice(0, sepIndex);
  const body = sepIndex === -1 ? '' : input.slice(sepIndex + SEPARATOR.length);

  const metadata: Record<string, string> = {};
  for (const line of headerPart.split('\n')) {
    const index = line.indexOf(':');
    if (index === -1) {
      continue;
    }

    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    metadata[key] = value;
  }

  return { metadata, body };
}

export function formatProjectFile(parsed: ParsedProjectFile): string {
  const headerLines = Object.entries(parsed.metadata).map(
    ([key, value]) => `${key}: ${value}`
  );

  return `${headerLines.join('\n')}\n---\n${parsed.body}`;
}
