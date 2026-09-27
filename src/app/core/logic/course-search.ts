import { AppLanguage } from '../preferences/preferences.service';
import { Course } from '../models/course.models';

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function filterCoursesBySearch(
  courses: readonly Course[],
  query: string,
  language: AppLanguage,
): Course[] {
  const needle = normalized(query);
  if (!needle) return [...courses];

  return courses.filter((course) => {
    const fields = [
      language === 'en' ? (course.titleEn ?? course.title) : course.title,
      language === 'en' ? (course.descriptionEn ?? course.description) : course.description,
      language === 'en' ? (course.instructorEn ?? course.instructor) : course.instructor,
      ...course.sections.flatMap((section) => [
        language === 'en' ? (section.titleEn ?? section.title) : section.title,
        ...section.lessons.map((lesson) =>
          language === 'en' ? (lesson.titleEn ?? lesson.title) : lesson.title,
        ),
      ]),
    ];
    return fields.some((field) => normalized(field).includes(needle));
  });
}
