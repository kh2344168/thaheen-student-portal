import { TestBed } from '@angular/core/testing';
import {
  Router,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
  UrlTree,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CourseDataService } from '../data/course-data.service';
import { CourseLoadStatus, Course } from '../models/course.models';
import { ProgressService } from '../progress/progress.service';
import { signal } from '@angular/core';
import { lessonAccessGuard } from './lesson-access.guard';

const course: Course = {
  id: 'movement-system',
  title: 'مدخل إلى الجهاز الحركي',
  instructor: 'د. سارة محمود',
  description: 'محتوى تجريبي للاختبار.',
  thumbnail: 'assets/images/anatomy-course.svg',
  sections: [
    {
      id: 'bones-and-joints',
      title: 'العظام والمفاصل',
      lessons: [
        {
          id: 'bone-structure',
          title: 'تركيب العظم',
          durationSec: 95,
          video: 'assets/videos/bones.mp4',
        },
        {
          id: 'joint-types',
          title: 'أنواع المفاصل',
          durationSec: 95,
          video: 'assets/videos/bones.mp4',
        },
      ],
    },
    {
      id: 'muscles-and-motion',
      title: 'العضلات والحركة',
      lessons: [
        {
          id: 'muscle-types',
          title: 'أنواع العضلات',
          durationSec: 95,
          video: 'assets/videos/bones.mp4',
        },
      ],
    },
  ],
};

describe('lessonAccessGuard', () => {
  let loadStatus: ReturnType<typeof signal<CourseLoadStatus>>;
  let completedKeys: ReturnType<typeof signal<Set<string>>>;
  let ensureLoaded: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loadStatus = signal<CourseLoadStatus>('idle');
    completedKeys = signal(new Set<string>());
    ensureLoaded = vi.fn(async () => {
      loadStatus.set('loaded');
    });

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CourseDataService,
          useValue: {
            ensureLoaded,
            status: loadStatus,
            getCourse: (courseId: string) => (courseId === course.id ? course : undefined),
          },
        },
        { provide: ProgressService, useValue: { completedKeys } },
      ],
    });
  });

  function runGuard(courseId: string, lessonId: string): Promise<boolean | UrlTree> {
    const route = {
      paramMap: convertToParamMap({ courseId, lessonId }),
    } as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    const result = TestBed.runInInjectionContext(() => lessonAccessGuard(route, state));
    return Promise.resolve(result as boolean | UrlTree | Promise<boolean | UrlTree>);
  }

  it('waits for course data, then redirects a directly opened locked lesson', async () => {
    const result = await runGuard(course.id, 'muscle-types');
    const router = TestBed.inject(Router);

    expect(ensureLoaded).toHaveBeenCalledOnce();
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/courses/movement-system?locked=1');
  });

  it('allows an unknown lesson through so the page can show not found', async () => {
    const result = await runGuard(course.id, 'missing-lesson');
    expect(result).toBe(true);
  });

  it('allows the next section after the previous lesson is completed', async () => {
    completedKeys.set(new Set(['movement-system::joint-types']));
    const result = await runGuard(course.id, 'muscle-types');
    expect(result).toBe(true);
  });
});
