export interface Lesson {
  id: string;
  title: string;
  titleEn?: string;
  durationSec: number;
  video: string;
}

export interface CourseSection {
  id: string;
  title: string;
  titleEn?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  titleEn?: string;
  instructor: string;
  instructorEn?: string;
  description: string;
  descriptionEn?: string;
  thumbnail: string;
  sections: CourseSection[];
}

export interface LessonProgress {
  positionSec: number;
  completed: boolean;
  updatedAt: string;
}

export interface ProgressSnapshot {
  schemaVersion: 1;
  lessons: Record<string, LessonProgress>;
  lastWatchedKey: string | null;
}

export type CourseLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';
export type LessonStatus = 'not-started' | 'in-progress' | 'completed';

export interface ContinueWatchingItem {
  course: Course;
  lesson: Lesson;
  positionSec: number;
  updatedAt: string;
}
