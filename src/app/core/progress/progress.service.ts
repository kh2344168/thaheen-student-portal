import { Injectable, computed, signal } from '@angular/core';
import { DiagnosticDetails, logDiagnostic, safeRouteId } from '../diagnostics';
import {
  calculateCourseProgress,
  findContinueWatching,
  progressKey,
} from '../logic/course-progress';
import {
  ContinueWatchingItem,
  Course,
  LessonProgress,
  ProgressSnapshot,
} from '../models/course.models';

const STORAGE_KEY = 'thaheen-offline-lms-progress-v1';

function emptySnapshot(): ProgressSnapshot {
  return { schemaVersion: 1, lessons: {}, lastWatchedKey: null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLessonProgress(value: unknown): value is LessonProgress {
  return (
    isRecord(value) &&
    typeof value['positionSec'] === 'number' &&
    Number.isFinite(value['positionSec']) &&
    value['positionSec'] >= 0 &&
    typeof value['completed'] === 'boolean' &&
    typeof value['updatedAt'] === 'string'
  );
}

function parseSnapshot(value: unknown): ProgressSnapshot {
  if (!isRecord(value) || value['schemaVersion'] !== 1 || !isRecord(value['lessons'])) {
    throw new Error('Invalid local progress format');
  }
  const lessons: Record<string, LessonProgress> = {};
  for (const [key, record] of Object.entries(value['lessons'])) {
    if (isLessonProgress(record) && key.length <= 130) lessons[key] = record;
  }
  const rawLastKey = value['lastWatchedKey'];
  const lastWatchedKey =
    typeof rawLastKey === 'string' && Object.hasOwn(lessons, rawLastKey) ? rawLastKey : null;
  return { schemaVersion: 1, lessons, lastWatchedKey };
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly _snapshot = signal<ProgressSnapshot>(this.readStorage());

  readonly snapshot = this._snapshot.asReadonly();
  readonly completedKeys = computed(
    () =>
      new Set(
        Object.entries(this._snapshot().lessons)
          .filter(([, value]) => value.completed)
          .map(([key]) => key),
      ),
  );

  getLessonProgress(courseId: string, lessonId: string): LessonProgress | undefined {
    return this._snapshot().lessons[progressKey(courseId, lessonId)];
  }

  getPosition(courseId: string, lessonId: string): number {
    return this.getLessonProgress(courseId, lessonId)?.positionSec ?? 0;
  }

  isCompleted(courseId: string, lessonId: string): boolean {
    return this.getLessonProgress(courseId, lessonId)?.completed ?? false;
  }

  getCourseProgress(course: Course): number {
    const lessons = course.sections.flatMap((section) => section.lessons);
    const completedCount = lessons.filter((lesson) =>
      this.isCompleted(course.id, lesson.id),
    ).length;
    return calculateCourseProgress(lessons.length, completedCount);
  }

  getContinueWatching(courses: readonly Course[]): ContinueWatchingItem | null {
    return findContinueWatching(courses, this._snapshot());
  }

  savePosition(courseId: string, lessonId: string, positionSec: number): void {
    if (!Number.isFinite(positionSec) || positionSec < 0) return;
    const key = progressKey(courseId, lessonId);
    const current = this._snapshot();
    const startedAt = Date.now();
    const next: ProgressSnapshot = {
      schemaVersion: 1,
      lessons: {
        ...current.lessons,
        [key]: {
          positionSec,
          completed: current.lessons[key]?.completed ?? false,
          updatedAt: new Date().toISOString(),
        },
      },
      lastWatchedKey: key,
    };
    this.persist(next, 'write-position', {
      courseId: safeRouteId(courseId),
      lessonId: safeRouteId(lessonId),
      startedAt,
    });
  }

  markCompleted(courseId: string, lessonId: string, positionSec: number): void {
    const key = progressKey(courseId, lessonId);
    const current = this._snapshot();
    const startedAt = Date.now();
    const next: ProgressSnapshot = {
      schemaVersion: 1,
      lessons: {
        ...current.lessons,
        [key]: {
          positionSec: Number.isFinite(positionSec) ? Math.max(0, positionSec) : 0,
          completed: true,
          updatedAt: new Date().toISOString(),
        },
      },
      lastWatchedKey: key,
    };
    this.persist(next, 'write-completion', {
      courseId: safeRouteId(courseId),
      lessonId: safeRouteId(lessonId),
      startedAt,
    });
  }

  private readStorage(): ProgressSnapshot {
    const startedAt = Date.now();
    logDiagnostic('info', 'progress', 'read:start', { key: STORAGE_KEY });
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        logDiagnostic('info', 'progress', 'read:success', {
          entryCount: 0,
          durationMs: Date.now() - startedAt,
        });
        return emptySnapshot();
      }
      const parsed = parseSnapshot(JSON.parse(raw) as unknown);
      logDiagnostic('info', 'progress', 'read:success', {
        entryCount: Object.keys(parsed.lessons).length,
        durationMs: Date.now() - startedAt,
      });
      return parsed;
    } catch (error: unknown) {
      logDiagnostic('warn', 'progress', 'read:recovered', {
        durationMs: Date.now() - startedAt,
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
      return emptySnapshot();
    }
  }

  private persist(next: ProgressSnapshot, event: string, details: DiagnosticDetails): void {
    const startedAt = details['startedAt'];
    const { startedAt: _startedAt, ...safeDetails } = details;
    logDiagnostic('info', 'progress', `${event}:start`, safeDetails);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      this._snapshot.set(next);
      logDiagnostic('info', 'progress', `${event}:success`, {
        courseId: details['courseId'],
        lessonId: details['lessonId'],
        durationMs: typeof startedAt === 'number' ? Date.now() - startedAt : 0,
        entryCount: Object.keys(next.lessons).length,
      });
    } catch (error: unknown) {
      logDiagnostic('error', 'progress', `${event}:failure`, {
        courseId: details['courseId'],
        lessonId: details['lessonId'],
        durationMs: typeof startedAt === 'number' ? Date.now() - startedAt : 0,
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }
}
