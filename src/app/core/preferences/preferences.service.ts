import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { logDiagnostic } from '../diagnostics';

export type AppLanguage = 'ar' | 'en';
export type AppTheme = 'light' | 'dark';
export type PlaybackRate = 1 | 1.25 | 1.5 | 2;

export interface AppPreferences {
  schemaVersion: 1;
  language: AppLanguage;
  theme: AppTheme;
  playbackRate: PlaybackRate;
}

export const PLAYBACK_RATES: readonly PlaybackRate[] = [1, 1.25, 1.5, 2];
const STORAGE_KEY = 'thaheen-offline-lms-preferences-v1';

function defaults(): AppPreferences {
  return { schemaVersion: 1, language: 'ar', theme: 'light', playbackRate: 1 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePreferences(value: unknown): AppPreferences {
  if (!isRecord(value) || value['schemaVersion'] !== 1) return defaults();
  const language: AppLanguage = value['language'] === 'en' ? 'en' : 'ar';
  const theme: AppTheme = value['theme'] === 'dark' ? 'dark' : 'light';
  const requestedRate = value['playbackRate'];
  const playbackRate = PLAYBACK_RATES.find((rate) => rate === requestedRate) ?? 1;
  return { schemaVersion: 1, language, theme, playbackRate };
}

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly _preferences = signal<AppPreferences>(this.readStorage());

  readonly preferences = this._preferences.asReadonly();
  readonly language = computed(() => this._preferences().language);
  readonly direction = computed(() => (this.language() === 'ar' ? 'rtl' : 'ltr'));
  readonly theme = computed(() => this._preferences().theme);
  readonly playbackRate = computed(() => this._preferences().playbackRate);

  constructor() {
    this.applyDocumentSettings();
  }

  setLanguage(language: AppLanguage): void {
    if (language === this.language()) return;
    this.update({ ...this._preferences(), language }, 'language');
  }

  toggleLanguage(): void {
    this.setLanguage(this.language() === 'ar' ? 'en' : 'ar');
  }

  setTheme(theme: AppTheme): void {
    if (theme === this.theme()) return;
    this.update({ ...this._preferences(), theme }, 'theme');
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'light' ? 'dark' : 'light');
  }

  setPlaybackRate(playbackRate: PlaybackRate): void {
    if (!PLAYBACK_RATES.includes(playbackRate) || playbackRate === this.playbackRate()) return;
    this.update({ ...this._preferences(), playbackRate }, 'playback-rate');
  }

  private readStorage(): AppPreferences {
    const startedAt = Date.now();
    logDiagnostic('info', 'preferences', 'read:start', { key: STORAGE_KEY });
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const value = raw ? parsePreferences(JSON.parse(raw) as unknown) : defaults();
      logDiagnostic('info', 'preferences', 'read:success', {
        durationMs: Date.now() - startedAt,
        language: value.language,
        theme: value.theme,
        playbackRate: value.playbackRate,
      });
      return value;
    } catch (error: unknown) {
      logDiagnostic('warn', 'preferences', 'read:recovered', {
        durationMs: Date.now() - startedAt,
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
      return defaults();
    }
  }

  private update(next: AppPreferences, reason: string): void {
    const startedAt = Date.now();
    logDiagnostic('info', 'preferences', 'write:start', {
      reason,
      language: next.language,
      theme: next.theme,
      playbackRate: next.playbackRate,
    });
    this._preferences.set(next);
    this.applyDocumentSettings();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      logDiagnostic('info', 'preferences', 'write:success', {
        reason,
        durationMs: Date.now() - startedAt,
      });
    } catch (error: unknown) {
      logDiagnostic('error', 'preferences', 'write:failure', {
        reason,
        durationMs: Date.now() - startedAt,
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }

  private applyDocumentSettings(): void {
    const root = this.document.documentElement;
    root.lang = this.language();
    root.dir = this.direction();
    root.dataset['theme'] = this.theme();
    this.document.title =
      this.language() === 'en' ? 'Thaheen | Learning Portal' : 'ذهين | بوابة التعلم';
    const themeColor = this.document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute('content', this.theme() === 'dark' ? '#19151d' : '#f7f5ef');
  }
}
