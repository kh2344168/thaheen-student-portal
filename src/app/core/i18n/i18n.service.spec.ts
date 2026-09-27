import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nService } from './i18n.service';
import { PreferencesService } from '../preferences/preferences.service';

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.removeItem('thaheen-offline-lms-preferences-v1');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.removeItem('thaheen-offline-lms-preferences-v1');
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    document.documentElement.dataset['theme'] = 'light';
  });

  it('translates labels and localized course data in both languages', () => {
    const i18n = TestBed.inject(I18nService);
    const preferences = TestBed.inject(PreferencesService);
    const course = {
      id: 'movement',
      title: 'الجهاز الحركي',
      titleEn: 'Musculoskeletal System',
      instructor: 'د. سارة',
      instructorEn: 'Dr. Sarah',
      description: 'العظام والمفاصل',
      descriptionEn: 'Bones and joints',
      thumbnail: 'assets/course.svg',
      sections: [],
    };

    expect(i18n.t('courses')).toBe('المقررات');
    expect(i18n.courseTitle(course)).toBe('الجهاز الحركي');
    preferences.setLanguage('en');
    expect(i18n.t('courseCount', { count: 2 })).toBe('2 courses');
    expect(i18n.courseTitle(course)).toBe('Musculoskeletal System');
    expect(i18n.direction()).toBe('ltr');
  });
});
