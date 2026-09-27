import { Injectable, signal } from '@angular/core';
import { logDiagnostic, safeRouteId } from '../diagnostics';
import { progressKey } from '../logic/course-progress';

const STORAGE_KEY = 'thaheen-offline-lms-notes-v1';
const MAX_NOTE_LENGTH = 4000;

interface NotesSnapshot {
  schemaVersion: 1;
  notes: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseNotes(value: unknown): NotesSnapshot {
  if (!isRecord(value) || value['schemaVersion'] !== 1 || !isRecord(value['notes'])) {
    throw new Error('Invalid local notes format');
  }
  const notes: Record<string, string> = {};
  for (const [key, note] of Object.entries(value['notes'])) {
    if (key.length <= 130 && typeof note === 'string') notes[key] = note.slice(0, MAX_NOTE_LENGTH);
  }
  return { schemaVersion: 1, notes };
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly _notes = signal<Record<string, string>>(this.readStorage());
  readonly notes = this._notes.asReadonly();

  getNote(courseId: string, lessonId: string): string {
    return this._notes()[progressKey(courseId, lessonId)] ?? '';
  }

  saveNote(courseId: string, lessonId: string, value: string): void {
    const key = progressKey(courseId, lessonId);
    const note = value.slice(0, MAX_NOTE_LENGTH);
    const startedAt = Date.now();
    logDiagnostic('info', 'notes', 'write:start', {
      courseId: safeRouteId(courseId),
      lessonId: safeRouteId(lessonId),
      characterCount: note.length,
    });
    const next = { ...this._notes() };
    if (note.trim().length === 0) delete next[key];
    else next[key] = note;
    this._notes.set(next);

    try {
      const snapshot: NotesSnapshot = { schemaVersion: 1, notes: next };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      logDiagnostic('info', 'notes', 'write:success', {
        courseId: safeRouteId(courseId),
        lessonId: safeRouteId(lessonId),
        durationMs: Date.now() - startedAt,
        noteCount: Object.keys(next).length,
      });
    } catch (error: unknown) {
      logDiagnostic('error', 'notes', 'write:failure', {
        courseId: safeRouteId(courseId),
        lessonId: safeRouteId(lessonId),
        durationMs: Date.now() - startedAt,
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }

  private readStorage(): Record<string, string> {
    const startedAt = Date.now();
    logDiagnostic('info', 'notes', 'read:start', { key: STORAGE_KEY });
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? parseNotes(JSON.parse(raw) as unknown) : { schemaVersion: 1, notes: {} };
      logDiagnostic('info', 'notes', 'read:success', {
        noteCount: Object.keys(parsed.notes).length,
        durationMs: Date.now() - startedAt,
      });
      return parsed.notes;
    } catch (error: unknown) {
      logDiagnostic('warn', 'notes', 'read:recovered', {
        durationMs: Date.now() - startedAt,
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
      return {};
    }
  }
}
