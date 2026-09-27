export type DiagnosticValue = string | number | boolean | null | undefined;
export type DiagnosticDetails = Record<string, DiagnosticValue>;

export function logDiagnostic(
  level: 'info' | 'warn' | 'error',
  area: string,
  event: string,
  details: DiagnosticDetails = {},
): void {
  const prefix = `[THAHEEN:${area}] ${event}`;
  if (level === 'error') {
    console.error(prefix, details);
    return;
  }
  if (level === 'warn') {
    console.warn(prefix, details);
    return;
  }
  console.info(prefix, details);
}

export function safeRouteId(value: string | null | undefined): string {
  if (!value || !/^[a-zA-Z0-9_-]{1,60}$/.test(value)) {
    return 'invalid-id';
  }
  return value;
}
