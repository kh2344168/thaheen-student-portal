import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CourseDataService } from '../data/course-data.service';
import { logDiagnostic, safeRouteId } from '../diagnostics';
import { isLessonUnlocked } from '../logic/course-progress';
import { ProgressService } from '../progress/progress.service';

export const lessonAccessGuard: CanActivateFn = (route) => {
  const courses = inject(CourseDataService);
  const progress = inject(ProgressService);
  const router = inject(Router);
  const courseId = route.paramMap.get('courseId') ?? '';
  const lessonId = route.paramMap.get('lessonId') ?? '';

  return courses.ensureLoaded().then(() => {
    if (courses.status() !== 'loaded') {
      logDiagnostic('warn', 'guard', 'allow-data-unavailable', {
        courseId: safeRouteId(courseId),
        lessonId: safeRouteId(lessonId),
      });
      return true;
    }

    const course = courses.getCourse(courseId);
    if (
      !course ||
      !course.sections.some((section) => section.lessons.some((lesson) => lesson.id === lessonId))
    ) {
      logDiagnostic('info', 'guard', 'allow-not-found-route', {
        courseId: safeRouteId(courseId),
        lessonId: safeRouteId(lessonId),
      });
      return true;
    }

    const allowed = isLessonUnlocked(course, lessonId, progress.completedKeys());
    logDiagnostic('info', 'guard', allowed ? 'allow-unlocked' : 'redirect-locked', {
      courseId: safeRouteId(courseId),
      lessonId: safeRouteId(lessonId),
    });

    return allowed
      ? true
      : router.createUrlTree(['/courses', courseId], { queryParams: { locked: '1' } });
  });
};
