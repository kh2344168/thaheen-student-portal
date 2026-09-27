import { describe, expect, it } from 'vitest';
import { formatDuration, formatPercent } from './format-duration';

describe('localized display formatting', () => {
  it('formats durations with Arabic or Latin digits based on the active locale', () => {
    expect(formatDuration(95, 'ar-EG')).toBe('١:٣٥');
    expect(formatDuration(95, 'en-US')).toBe('1:35');
  });

  it('formats progress as a localized percentage', () => {
    expect(formatPercent(50, 'en-US')).toBe('50%');
    expect(formatPercent(50, 'ar-EG')).toContain('٥٠');
  });
});
