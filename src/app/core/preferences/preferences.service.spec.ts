import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PreferencesService } from './preferences.service';

const STORAGE_KEY = 'thaheen-offline-lms-preferences-v1';

describe('PreferencesService', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  });

  it('defaults to Arabic, right-to-left, light mode, and normal speed', () => {
    const service = TestBed.inject(PreferencesService);
    expect(service.language()).toBe('ar');
    expect(service.direction()).toBe('rtl');
    expect(service.theme()).toBe('light');
    expect(service.playbackRate()).toBe(1);
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('persists language, theme, and supported playback speed', () => {
    const service = TestBed.inject(PreferencesService);
    service.setLanguage('en');
    service.setTheme('dark');
    service.setPlaybackRate(1.5);

    expect(service.direction()).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      language: 'en',
      theme: 'dark',
      playbackRate: 1.5,
    });
  });
});
