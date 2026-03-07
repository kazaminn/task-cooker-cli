export function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function toCell(value: string | number | undefined): string {
  if (value === undefined) {
    return '';
  }

  return String(value);
}

export function formatTable(
  headers: string[],
  rows: (string | number | undefined)[][]
): string {
  const renderedRows = rows.map((row) => row.map((cell) => toCell(cell)));
  const widths = headers.map((header, index) =>
    Math.max(
      header.length,
      ...renderedRows.map((row) => (row[index] ?? '').length),
      0
    )
  );

  const headerLine = headers
    .map((header, index) => header.padEnd(widths[index]))
    .join('  ');
  const bodyLines = renderedRows.map((row) =>
    row.map((cell, index) => cell.padEnd(widths[index])).join('  ')
  );

  return [headerLine, ...bodyLines].join('\n');
}
