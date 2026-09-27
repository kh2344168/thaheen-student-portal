import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { logDiagnostic } from '../diagnostics';
import { Course, CourseLoadStatus } from '../models/course.models';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasValidOptionalTranslation(record: Record<string, unknown>, key: string): boolean {
  return record[key] === undefined || isString(record[key]);
}

function isLesson(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isString(value['id']) &&
    isString(value['title']) &&
    hasValidOptionalTranslation(value, 'titleEn') &&
    typeof value['durationSec'] === 'number' &&
    Number.isFinite(value['durationSec']) &&
    value['durationSec'] > 0 &&
    isString(value['video'])
  );
}

function isSection(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isString(value['id']) &&
    isString(value['title']) &&
    hasValidOptionalTranslation(value, 'titleEn') &&
    Array.isArray(value['lessons']) &&
    value['lessons'].every(isLesson)
  );
}

function isCourse(value: unknown): value is Course {
  if (!isRecord(value)) return false;
  return (
    isString(value['id']) &&
    isString(value['title']) &&
    hasValidOptionalTranslation(value, 'titleEn') &&
    isString(value['instructor']) &&
    hasValidOptionalTranslation(value, 'instructorEn') &&
    isString(value['description']) &&
    hasValidOptionalTranslation(value, 'descriptionEn') &&
    isString(value['thumbnail']) &&
    Array.isArray(value['sections']) &&
    value['sections'].every(isSection)
  );
}

function parseCourses(payload: unknown): Course[] {
  if (!Array.isArray(payload) || !payload.every(isCourse)) {
    throw new Error('Invalid courses.json structure');
  }
  return payload;
}

@Injectable({ providedIn: 'root' })
export class CourseDataService {
  private readonly http = inject(HttpClient);
  private inFlight: Promise<void> | null = null;

  private readonly _courses = signal<readonly Course[]>([]);
  private readonly _status = signal<CourseLoadStatus>('idle');
  private readonly _errorMessage = signal<string | null>(null);

  readonly courses = this._courses.asReadonly();
  readonly status = this._status.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly hasCourses = computed(() => this._courses().length > 0);

  ensureLoaded(): Promise<void> {
    if (this._status() === 'loaded') return Promise.resolve();
    if (this.inFlight) return this.inFlight;

    const startedAt = Date.now();
    this._status.set('loading');
    this._errorMessage.set(null);
    logDiagnostic('info', 'data', 'load:start', { source: 'assets/data/courses.json' });

    this.inFlight = firstValueFrom(this.http.get<unknown>('assets/data/courses.json'))
      .then((payload) => {
        const courses = parseCourses(payload);
        this._courses.set(courses);
        this._status.set('loaded');
        logDiagnostic('info', 'data', 'load:success', {
          courseCount: courses.length,
          durationMs: Date.now() - startedAt,
        });
      })
      .catch((error: unknown) => {
        this._courses.set([]);
        this._status.set('error');
        this._errorMessage.set('تعذّر تحميل بيانات الكورسات. حاول إعادة التحميل.');
        logDiagnostic('error', 'data', 'load:failure', {
          durationMs: Date.now() - startedAt,
          errorType: error instanceof Error ? error.name : 'UnknownError',
        });
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  retry(): Promise<void> {
    this._status.set('idle');
    return this.ensureLoaded();
  }

  getCourse(courseId: string): Course | undefined {
    return this._courses().find((course) => course.id === courseId);
  }
}
