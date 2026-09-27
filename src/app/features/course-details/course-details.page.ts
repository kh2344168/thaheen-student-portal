import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseDataService } from '../../core/data/course-data.service';
import { safeRouteId } from '../../core/diagnostics';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  isLessonUnlocked,
  getLessonStatus,
  flattenLessons,
} from '../../core/logic/course-progress';
import { ProgressService } from '../../core/progress/progress.service';
import { formatDuration, formatNumber, formatPercent } from '../../shared/format-duration';
import { UiStateComponent } from '../../shared/ui-state/ui-state.component';

@Component({
  imports: [RouterLink, UiStateComponent],
  selector: 'app-course-details-page',
  styleUrl: './course-details.page.scss',
  templateUrl: './course-details.page.html',
})
export class CourseDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly courseData = inject(CourseDataService);
  readonly i18n = inject(I18nService);
  readonly progress = inject(ProgressService);
  readonly courseId = signal(this.route.snapshot.paramMap.get('courseId') ?? '');
  readonly lockedMessage = signal(false);
  readonly expandedSections = signal<ReadonlySet<string>>(new Set());
  readonly course = computed(() =>
    this.courseData.courses().find((item) => item.id === this.courseId()),
  );
  readonly lessons = computed(() => (this.course() ? flattenLessons(this.course()!) : []));
  readonly progressPercent = computed(() =>
    this.course() ? this.progress.getCourseProgress(this.course()!) : 0,
  );
  readonly completedLessonCount = computed(
    () =>
      this.lessons().filter((lesson) => this.progress.isCompleted(this.courseId(), lesson.id))
        .length,
  );

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const nextCourseId = params.get('courseId') ?? '';
      if (nextCourseId !== this.courseId()) this.expandedSections.set(new Set());
      this.courseId.set(nextCourseId);
      const nextCourse = this.course();
      if (nextCourse)
        this.expandedSections.set(new Set(nextCourse.sections.map((section) => section.id)));
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.lockedMessage.set(params.get('locked') === '1');
    });
  }

  ngOnInit(): void {
    void this.courseData.ensureLoaded().then(() => {
      const course = this.course();
      if (course) this.expandedSections.set(new Set(course.sections.map((section) => section.id)));
    });
  }

  isExpanded(sectionId: string): boolean {
    return this.expandedSections().has(sectionId);
  }

  toggleSection(sectionId: string): void {
    this.expandedSections.update((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  isUnlocked(lessonId: string): boolean {
    const course = this.course();
    return course ? isLessonUnlocked(course, lessonId, this.progress.completedKeys()) : false;
  }

  status(lessonId: string): 'not-started' | 'in-progress' | 'completed' {
    return getLessonStatus(this.progress.getLessonProgress(this.courseId(), lessonId));
  }

  statusLabel(lessonId: string): string {
    return this.i18n.lessonStatus(this.status(lessonId));
  }

  lessonCountLabel(value: number): string {
    return this.i18n.t('lessonsCount', { count: this.formatNumber(value) });
  }

  formatDuration = (value: number): string => formatDuration(value, this.numberLocale());
  formatNumber = (value: number): string => formatNumber(value, this.numberLocale());
  formatPercent = (value: number): string => formatPercent(value, this.numberLocale());
  safeId = safeRouteId;

  private numberLocale(): string {
    return this.i18n.language() === 'en' ? 'en-US' : 'ar-EG';
  }

  retry(): void {
    void this.courseData.retry();
  }
}
