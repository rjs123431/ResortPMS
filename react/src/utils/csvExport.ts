/**
 * Build a CSV string from an array of objects and trigger a file download.
 * Escapes double quotes in cell values.
 */
export function downloadCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
): void {
  if (rows.length === 0) {
    const headers = columns?.map((c) => c.header) ?? [];
    const csv = headers.join(',') + '\n';
    doDownload(csv, filename);
    return;
  }
  const keys = columns ? columns.map((c) => c.key) : (Object.keys(rows[0]) as (keyof T)[]);
  const headers = columns ? columns.map((c) => c.header) : (keys as string[]);
  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const line = (row: T) => keys.map((k) => escape(row[k])).join(',');
  const csv = [headers.join(','), ...rows.map(line)].join('\n');
  doDownload(csv, filename);
}

function doDownload(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
