export function formatDuration(totalSeconds: number, locale = 'ar-EG'): string {
  const integer = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return `${new Intl.NumberFormat(locale, { useGrouping: false }).format(0)}:${integer.format(0)}`;
  }
  const wholeSeconds = Math.floor(totalSeconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;
  return `${new Intl.NumberFormat(locale, { useGrouping: false }).format(minutes)}:${integer.format(seconds)}`;
}

export function formatPercent(value: number, locale = 'ar-EG'): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value / 100 : 0,
  );
}

export function formatNumber(value: number, locale = 'ar-EG'): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}
