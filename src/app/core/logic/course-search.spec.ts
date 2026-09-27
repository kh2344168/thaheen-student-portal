import { describe, expect, it } from 'vitest';
import { Course } from '../models/course.models';
import { filterCoursesBySearch } from './course-search';

const courses: Course[] = [
  {
    id: 'movement',
    title: 'الجهاز الحركي',
    titleEn: 'Musculoskeletal System',
    instructor: 'د. سارة',
    instructorEn: 'Dr. Sarah',
    description: 'العظام والمفاصل',
    descriptionEn: 'Bones and joints',
    thumbnail: 'assets/movement.svg',
    sections: [
      {
        id: 'bones',
        title: 'العظام',
        titleEn: 'Bones',
        lessons: [
          {
            id: 'structure',
            title: 'تركيب العظم',
            titleEn: 'Bone Structure',
            durationSec: 95,
            video: 'assets/bones.mp4',
          },
        ],
      },
    ],
  },
];

describe('filterCoursesBySearch', () => {
  it('filters by Arabic course, instructor, or lesson text', () => {
    expect(filterCoursesBySearch(courses, 'تركيب العظم', 'ar')).toHaveLength(1);
    expect(filterCoursesBySearch(courses, 'سارة', 'ar')).toHaveLength(1);
    expect(filterCoursesBySearch(courses, 'غير موجود', 'ar')).toHaveLength(0);
  });

  it('filters by English localized text and returns all courses for a blank query', () => {
    expect(filterCoursesBySearch(courses, 'bone structure', 'en')).toHaveLength(1);
    expect(filterCoursesBySearch(courses, '   ', 'en')).toHaveLength(1);
  });
});
