import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseDataService } from '../../core/data/course-data.service';
import { flattenLessons } from '../../core/logic/course-progress';
import { filterCoursesBySearch } from '../../core/logic/course-search';
import { I18nService } from '../../core/i18n/i18n.service';
import { ProgressService } from '../../core/progress/progress.service';
import { formatDuration, formatNumber, formatPercent } from '../../shared/format-duration';
import { UiStateComponent } from '../../shared/ui-state/ui-state.component';

@Component({
  imports: [RouterLink, UiStateComponent],
  selector: 'app-courses-list-page',
  styleUrl: './courses-list.page.scss',
  templateUrl: './courses-list.page.html',
})
export class CoursesListPage implements OnInit {
  readonly courseData = inject(CourseDataService);
  readonly i18n = inject(I18nService);
  private readonly progress = inject(ProgressService);
  readonly searchTerm = signal('');

  readonly cards = computed(() =>
    filterCoursesBySearch(this.courseData.courses(), this.searchTerm(), this.i18n.language()).map(
      (course) => ({
        course,
        lessonCount: flattenLessons(course).length,
        progress: this.progress.getCourseProgress(course),
      }),
    ),
  );

  readonly continueWatching = computed(() =>
    this.progress.getContinueWatching(this.courseData.courses()),
  );
  readonly continuePercent = computed(() => {
    const item = this.continueWatching();
    if (!item || item.lesson.durationSec <= 0) return 0;
    return Math.min(100, Math.round((item.positionSec / item.lesson.durationSec) * 100));
  });

  ngOnInit(): void {
    void this.courseData.ensureLoaded();
  }

  formatDuration = (value: number): string => formatDuration(value, this.numberLocale());
  formatNumber = (value: number): string => formatNumber(value, this.numberLocale());
  formatPercent = (value: number): string => formatPercent(value, this.numberLocale());

  private numberLocale(): string {
    return this.i18n.language() === 'en' ? 'en-US' : 'ar-EG';
  }

  onSearch(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) this.searchTerm.set(target.value);
  }

  retry(): void {
    void this.courseData.retry();
  }
}
