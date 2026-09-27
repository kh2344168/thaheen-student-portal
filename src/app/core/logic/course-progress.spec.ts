import { describe, expect, it } from 'vitest';
import { Course } from '../models/course.models';
import {
  calculateCourseProgress,
  LESSON_COMPLETION_PERCENT,
  isLessonCompleteAtPosition,
  isLessonUnlocked,
  progressKey,
} from './course-progress';

const sampleCourse: Course = {
  id: 'anatomy',
  title: 'مبادئ التشريح',
  instructor: 'د. سارة محمود',
  description: 'مقدمة مبسطة.',
  thumbnail: 'assets/images/anatomy-course.svg',
  sections: [
    {
      id: 'one',
      title: 'القسم الأول',
      lessons: [
        { id: 'l1', title: 'الدرس الأول', durationSec: 95, video: 'assets/videos/bones.mp4' },
      ],
    },
    {
      id: 'two',
      title: 'القسم الثاني',
      lessons: [
        { id: 'l2', title: 'الدرس الثاني', durationSec: 95, video: 'assets/videos/heart.mp4' },
      ],
    },
  ],
};

describe('course progress logic', () => {
  it('completes a lesson at 90 percent of its duration', () => {
    expect(LESSON_COMPLETION_PERCENT).toBe(90);
    expect(isLessonCompleteAtPosition(90, 100)).toBe(true);
    expect(isLessonCompleteAtPosition(89, 100)).toBe(false);
    expect(isLessonCompleteAtPosition(10, 0)).toBe(false);
  });

  it('keeps the next section locked until the preceding lesson is complete', () => {
    expect(isLessonUnlocked(sampleCourse, 'l2', new Set())).toBe(false);
    expect(isLessonUnlocked(sampleCourse, 'l2', new Set([progressKey('anatomy', 'l1')]))).toBe(
      true,
    );
    expect(isLessonUnlocked(sampleCourse, 'missing', new Set())).toBe(true);
  });

  it('calculates completed-lesson progress and handles an empty course', () => {
    expect(calculateCourseProgress(4, 1)).toBe(25);
    expect(calculateCourseProgress(4, 8)).toBe(100);
    expect(calculateCourseProgress(0, 0)).toBe(0);
  });
});
