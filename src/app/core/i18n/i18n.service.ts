import { Injectable, inject } from '@angular/core';
import { Course, CourseSection, Lesson, LessonStatus } from '../models/course.models';
import { AppLanguage, PreferencesService } from '../preferences/preferences.service';

const ARABIC_TEXT = {
  brandName: 'ثهين',
  brandSubtitle: 'مساحة التعلّم',
  courses: 'المقررات',
  journey: 'رحلتك التعليمية',
  student: 'خالد',
  footerQuote: 'خطوة صغيرة كل يوم تصنع فرقًا كبيرًا',
  switchLanguage: 'English',
  switchLanguageAria: 'Switch to English',
  enableDarkMode: 'تفعيل الوضع الداكن',
  enableLightMode: 'تفعيل الوضع الفاتح',
  coursesLoadingTitle: 'لحظة واحدة',
  coursesLoadingMessage: 'نجهّز مساحتك التعليمية…',
  coursesErrorTitle: 'لم نتمكن من تحميل الكورسات',
  coursesErrorMessage: 'تعذّر تحميل بيانات الكورسات. جرّب مرة أخرى.',
  retry: 'إعادة المحاولة',
  coursesEmptyTitle: 'لا توجد كورسات بعد',
  coursesEmptyMessage: 'ستظهر كورساتك هنا عندما تصبح متاحة.',
  welcomeTitle: 'المقررات الدراسية',
  continueWatching: 'أكمل المشاهدة',
  instructorPrefix: 'مع',
  continueAction: 'تابع من حيث توقفت',
  lastLesson: 'آخر درس شاهدته',
  coursesHeading: 'مقرراتك',
  coursesDescription: 'محتوى مختار ليدعم رحلتك في العلوم الصحية.',
  courseCount: '{count} مقررات',
  healthSciences: 'علوم صحية',
  coursePath: 'مسار المقرر',
  lessonsCount: '{count} دروس',
  courseProgress: 'نسبة التقدم في المقرر',
  viewCourse: 'عرض المقرر',
  searchCourses: 'ابحث في المقررات',
  searchPlaceholder: 'ابحث باسم المقرر أو الدرس أو المدرّس',
  searchEmptyTitle: 'لا توجد نتائج مطابقة',
  searchEmptyMessage: 'جرّب كلمة أخرى أو امسح البحث لعرض جميع المقررات.',
  courseLoadingTitle: 'نجهّز الكورس',
  courseLoadingMessage: 'لحظات ونفتح لك الدروس.',
  courseErrorTitle: 'تعذّر تحميل الكورس',
  courseNotFoundTitle: 'الكورس غير موجود',
  courseNotFoundMessage: 'قد يكون الرابط غير صحيح أو أن المقرر لم يعد متاحًا.',
  breadcrumbs: 'مسار التنقل',
  lockedNoticeTitle: 'هذا الدرس مقفل',
  lockedNoticeMessage: 'أكمل الدرس السابق لفتحه.',
  dismissMessage: 'إخفاء الرسالة',
  healthLearningPath: 'مسار العلوم الصحية',
  sectionsCount: '{count} أقسام',
  completedLessons: 'الدروس المكتملة',
  unlockRule: 'يفتح كل درس بعد إكمال الدرس السابق',
  taughtBy: 'يقدّمه',
  courseContent: 'محتوى الكورس',
  sectionsAndLessons: 'الأقسام والدروس',
  noLessonsTitle: 'لا يحتوي هذا المقرر على دروس بعد',
  noLessonsMessage: 'سيظهر محتوى المقرر هنا عند إضافته.',
  lessonNumber: 'الدرس {number}',
  statusNotStarted: 'لم يبدأ',
  statusInProgress: 'قيد المشاهدة',
  statusCompleted: 'مكتمل',
  locked: 'مقفل',
  lessonLoadingTitle: 'نجهّز مشغل الدرس',
  lessonLoadingMessage: 'لحظات ونبدأ التعلّم.',
  lessonErrorTitle: 'تعذّر تحميل بيانات الدرس',
  lessonNotFoundTitle: 'الدرس غير موجود',
  lessonNotFoundMessage: 'الرابط ده لا يشير إلى درس متاح في الكورس.',
  lessonDuration: 'مدة الدرس',
  backToCourse: 'صفحة الكورس',
  unsupportedVideo: 'متصفحك لا يدعم تشغيل الفيديو.',
  videoUnavailable: 'الفيديو مش متاح حاليًا',
  videoUnavailableMessage: 'تأكد إن ملف الفيديو المحلي موجود وسليم، وبعدها جرّب تاني.',
  seekPosition: 'موضع الفيديو',
  localVideoLabel: 'مقطع تعليمي محلي',
  muteAudio: 'كتم الصوت',
  unmuteAudio: 'تشغيل الصوت',
  pause: 'إيقاف مؤقت',
  playVideo: 'تشغيل الفيديو',
  play: 'تشغيل',
  playbackSpeed: 'سرعة التشغيل',
  fullscreen: 'ملء الشاشة',
  exitFullscreen: 'إنهاء ملء الشاشة',
  completionTitle: 'أحسنت!',
  completionMessage: 'اكتمل الدرس، والدرس التالي بقى متاحًا.',
  aboutLesson: 'عن هذا الدرس',
  lessonSummary: 'شاهد المحتوى بالسرعة المناسبة لك. تقدمك محفوظ تلقائيًا على جهازك.',
  nextLesson: 'الدرس التالي',
  nextReady: 'جاهز للخطوة التالية؟',
  nextLocked: 'أكمل الدرس لفتح التالي',
  allLessonsDone: 'أنهيت كل الدروس',
  finishLessonFirst: 'أكمل الدرس أولًا',
  backToCourseAction: 'العودة للكورس',
  coursePathHeading: 'مسار الكورس',
  courseLessons: 'دروس الكورس',
  currentLesson: 'الدرس الحالي',
  progressAutoSaved: 'تقدّمك محفوظ تلقائيًا',
  keyboardHint: 'اختصارات: Space تشغيل/إيقاف · ← رجوع ٥ ث · → تقديم ٥ ث',
  lessonNotes: 'ملاحظات الدرس',
  notePlaceholder: 'اكتب ملاحظتك هنا… تُحفظ تلقائيًا على جهازك.',
  noteSaved: 'تم حفظ الملاحظات محليًا',
  noteLimit: 'حتى ٤٠٠٠ حرف',
} as const;

type TranslationKey = keyof typeof ARABIC_TEXT;

const ENGLISH_TEXT: Record<TranslationKey, string> = {
  brandName: 'Thaheen',
  brandSubtitle: 'Learning space',
  courses: 'Courses',
  journey: 'Your learning journey',
  student: 'Khaled',
  footerQuote: 'A small step each day makes a big difference',
  switchLanguage: 'عربي',
  switchLanguageAria: 'التبديل إلى العربية',
  enableDarkMode: 'Enable dark mode',
  enableLightMode: 'Enable light mode',
  coursesLoadingTitle: 'One moment',
  coursesLoadingMessage: 'Preparing your learning space…',
  coursesErrorTitle: 'Could not load courses',
  coursesErrorMessage: 'Course data could not be loaded. Please try again.',
  retry: 'Try again',
  coursesEmptyTitle: 'No courses yet',
  coursesEmptyMessage: 'Your courses will appear here when available.',
  welcomeTitle: 'Courses',
  continueWatching: 'Continue watching',
  instructorPrefix: 'With',
  continueAction: 'Resume where you left off',
  lastLesson: 'Last lesson you watched',
  coursesHeading: 'My courses',
  coursesDescription: 'Selected learning to support your health-sciences journey.',
  courseCount: '{count} courses',
  healthSciences: 'Health sciences',
  coursePath: 'Course path',
  lessonsCount: '{count} lessons',
  courseProgress: 'Course progress',
  viewCourse: 'View course',
  searchCourses: 'Search courses',
  searchPlaceholder: 'Search by course, lesson, or instructor',
  searchEmptyTitle: 'No matching results',
  searchEmptyMessage: 'Try another word or clear the search to see all courses.',
  courseLoadingTitle: 'Preparing your course',
  courseLoadingMessage: 'Your lessons will be ready in a moment.',
  courseErrorTitle: 'Could not load this course',
  courseNotFoundTitle: 'Course not found',
  courseNotFoundMessage: 'The link may be incorrect or the course is no longer available.',
  breadcrumbs: 'Breadcrumbs',
  lockedNoticeTitle: 'This lesson is still locked',
  lockedNoticeMessage: 'Complete the previous lesson to unlock it.',
  dismissMessage: 'Dismiss message',
  healthLearningPath: 'Health sciences learning path',
  sectionsCount: '{count} sections',
  completedLessons: 'Lessons completed',
  unlockRule: 'Complete each lesson to unlock the next one',
  taughtBy: 'Instructor',
  courseContent: 'Course content',
  sectionsAndLessons: 'Sections and lessons',
  noLessonsTitle: 'No lessons in this course yet',
  noLessonsMessage: 'Course content will appear here when it is added.',
  lessonNumber: 'Lesson {number}',
  statusNotStarted: 'Not started',
  statusInProgress: 'In progress',
  statusCompleted: 'Completed',
  locked: 'Locked',
  lessonLoadingTitle: 'Preparing the lesson player',
  lessonLoadingMessage: 'Your lesson will start in a moment.',
  lessonErrorTitle: 'Could not load lesson data',
  lessonNotFoundTitle: 'Lesson not found',
  lessonNotFoundMessage: 'This link does not match a lesson in the course.',
  lessonDuration: 'Lesson duration',
  backToCourse: 'Course page',
  unsupportedVideo: 'Your browser does not support video playback.',
  videoUnavailable: 'Video is not available right now',
  videoUnavailableMessage: 'Check that the local video file exists and is valid, then try again.',
  seekPosition: 'Video position',
  localVideoLabel: 'Local learning clip',
  muteAudio: 'Mute audio',
  unmuteAudio: 'Unmute audio',
  pause: 'Pause',
  playVideo: 'Play video',
  play: 'Play',
  playbackSpeed: 'Playback speed',
  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit fullscreen',
  completionTitle: 'Well done!',
  completionMessage: 'Lesson completed. The next lesson is now available.',
  aboutLesson: 'About this lesson',
  lessonSummary: 'Watch at a pace that works for you. Your progress is saved on this device.',
  nextLesson: 'Next lesson',
  nextReady: 'Ready for the next step?',
  nextLocked: 'Complete this lesson to unlock the next one',
  allLessonsDone: 'You finished all lessons',
  finishLessonFirst: 'Complete this lesson first',
  backToCourseAction: 'Back to course',
  coursePathHeading: 'Course path',
  courseLessons: 'Course lessons',
  currentLesson: 'Current lesson',
  progressAutoSaved: 'Progress is saved automatically',
  keyboardHint: 'Shortcuts: Space play/pause · ← back 5s · → forward 5s',
  lessonNotes: 'Lesson notes',
  notePlaceholder: 'Write your note here… saved automatically on this device.',
  noteSaved: 'Notes are saved locally',
  noteLimit: 'Up to 4,000 characters',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly preferences = inject(PreferencesService);

  readonly language = this.preferences.language;
  readonly direction = this.preferences.direction;

  t(key: TranslationKey, values: Readonly<Record<string, string | number>> = {}): string {
    const table = this.language() === 'en' ? ENGLISH_TEXT : ARABIC_TEXT;
    let result: string = table[key];
    for (const [name, value] of Object.entries(values)) {
      result = result.replaceAll(`{${name}}`, String(value));
    }
    return result;
  }

  courseTitle(course: Course): string {
    return this.localize(course.title, course.titleEn);
  }

  courseDescription(course: Course): string {
    return this.localize(course.description, course.descriptionEn);
  }

  instructorName(course: Course): string {
    return this.localize(course.instructor, course.instructorEn);
  }

  instructorInitial(course: Course): string {
    return this.language() === 'en'
      ? (course.instructorEn?.replace(/^Dr\.\s*/i, '').charAt(0) ?? 'I')
      : course.instructor.replace(/^د\.\s*/, '').charAt(0);
  }

  sectionTitle(section: CourseSection): string {
    return this.localize(section.title, section.titleEn);
  }

  lessonTitle(lesson: Lesson): string {
    return this.localize(lesson.title, lesson.titleEn);
  }

  lessonStatus(status: LessonStatus): string {
    const key: Record<LessonStatus, TranslationKey> = {
      'not-started': 'statusNotStarted',
      'in-progress': 'statusInProgress',
      completed: 'statusCompleted',
    };
    return this.t(key[status]);
  }

  private localize(arabic: string, english: string | undefined): string {
    return this.language() === 'en' && english ? english : arabic;
  }
}

export type { TranslationKey };
