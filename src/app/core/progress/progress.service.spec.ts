import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProgressService } from './progress.service';

describe('ProgressService local persistence', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('restores a lesson position after the service is recreated', () => {
    const firstSession = new ProgressService();
    firstSession.savePosition('movement-system', 'bone-structure', 42);

    const refreshedSession = new ProgressService();
    expect(refreshedSession.getPosition('movement-system', 'bone-structure')).toBe(42);
    expect(refreshedSession.getLessonProgress('movement-system', 'bone-structure')?.completed).toBe(
      false,
    );
  });

  it('recovers safely from malformed saved progress', () => {
    localStorage.setItem('thaheen-offline-lms-progress-v1', '{broken json');

    const service = new ProgressService();
    expect(service.getPosition('movement-system', 'bone-structure')).toBe(0);
    expect(service.snapshot().schemaVersion).toBe(1);
  });
});
