import {
  ContinueWatchingItem,
  Course,
  Lesson,
  LessonProgress,
  ProgressSnapshot,
} from '../models/course.models';

export const LESSON_COMPLETION_PERCENT = 90;

export function progressKey(courseId: string, lessonId: string): string {
  return `${courseId}::${lessonId}`;
}

export function flattenLessons(course: Course): Lesson[] {
  return course.sections.flatMap((section) => section.lessons);
}

export function isLessonCompleteAtPosition(positionSec: number, durationSec: number): boolean {
  if (!Number.isFinite(positionSec) || !Number.isFinite(durationSec) || durationSec <= 0) {
    return false;
  }
  return (Math.max(0, positionSec) / durationSec) * 100 >= LESSON_COMPLETION_PERCENT;
}

export function isLessonUnlocked(
  course: Course,
  lessonId: string,
  completedLessonKeys: ReadonlySet<string>,
): boolean {
  const orderedLessons = flattenLessons(course);
  const targetIndex = orderedLessons.findIndex((lesson) => lesson.id === lessonId);
  if (targetIndex < 0 || targetIndex === 0) {
    return true;
  }

  const previousLesson = orderedLessons[targetIndex - 1];
  return completedLessonKeys.has(progressKey(course.id, previousLesson.id));
}

export function calculateCourseProgress(totalLessons: number, completedLessons: number): number {
  if (!Number.isFinite(totalLessons) || totalLessons <= 0) {
    return 0;
  }
  const safeCompleted = Math.max(0, Math.min(totalLessons, Math.floor(completedLessons)));
  return Math.round((safeCompleted / totalLessons) * 100);
}

export function getLessonStatus(
  progress: LessonProgress | undefined,
): 'not-started' | 'in-progress' | 'completed' {
  if (!progress) {
    return 'not-started';
  }
  return progress.completed ? 'completed' : 'in-progress';
}

export function findContinueWatching(
  courses: readonly Course[],
  snapshot: ProgressSnapshot,
): ContinueWatchingItem | null {
  let latest: ContinueWatchingItem | null = null;

  for (const course of courses) {
    for (const lesson of flattenLessons(course)) {
      const key = progressKey(course.id, lesson.id);
      const progress = snapshot.lessons[key];
      if (!progress || progress.completed) {
        continue;
      }
      if (progress.positionSec <= 0 && snapshot.lastWatchedKey !== key) {
        continue;
      }
      if (Number.isNaN(Date.parse(progress.updatedAt))) {
        continue;
      }
      if (!latest || Date.parse(progress.updatedAt) > Date.parse(latest.updatedAt)) {
        latest = {
          course,
          lesson,
          positionSec: progress.positionSec,
          updatedAt: progress.updatedAt,
        };
      }
    }
  }

  return latest;
}
