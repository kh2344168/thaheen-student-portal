import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseDataService } from '../../core/data/course-data.service';
import { logDiagnostic, safeRouteId } from '../../core/diagnostics';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  flattenLessons,
  LESSON_COMPLETION_PERCENT,
  isLessonCompleteAtPosition,
  isLessonUnlocked,
} from '../../core/logic/course-progress';
import {
  isInteractiveKeyboardTarget,
  resolvePlayerShortcut,
  seekPosition,
} from '../../core/logic/player-shortcuts';
import { NotesService } from '../../core/notes/notes.service';
import {
  PlaybackRate,
  PLAYBACK_RATES,
  PreferencesService,
} from '../../core/preferences/preferences.service';
import { ProgressService } from '../../core/progress/progress.service';
import { CourseSection, Lesson } from '../../core/models/course.models';
import { formatDuration, formatNumber } from '../../shared/format-duration';
import { UiStateComponent } from '../../shared/ui-state/ui-state.component';
import { resetLessonPlayback } from './lesson-playback';

interface PlayerLessonRow {
  lesson: Lesson;
  section: CourseSection;
}

@Component({
  imports: [RouterLink, UiStateComponent],
  selector: 'app-lesson-player-page',
  styleUrl: './lesson-player.page.scss',
  templateUrl: './lesson-player.page.html',
})
export class LessonPlayerPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly videoElement = viewChild<ElementRef<HTMLVideoElement>>('videoElement');
  readonly courseData = inject(CourseDataService);
  readonly i18n = inject(I18nService);
  readonly preferences = inject(PreferencesService);
  readonly notes = inject(NotesService);
  private readonly progress = inject(ProgressService);

  readonly courseId = signal(this.route.snapshot.paramMap.get('courseId') ?? '');
  readonly lessonId = signal(this.route.snapshot.paramMap.get('lessonId') ?? '');
  readonly course = computed(() =>
    this.courseData.courses().find((item) => item.id === this.courseId()),
  );
  readonly lesson = computed(() => {
    const course = this.course();
    return course ? flattenLessons(course).find((item) => item.id === this.lessonId()) : undefined;
  });
  readonly lessonRows = computed<PlayerLessonRow[]>(
    () =>
      this.course()?.sections.flatMap((section) =>
        section.lessons.map((lesson) => ({ lesson, section })),
      ) ?? [],
  );
  readonly activeIndex = computed(() =>
    this.lessonRows().findIndex((row) => row.lesson.id === this.lessonId()),
  );
  readonly nextLesson = computed(() => this.lessonRows()[this.activeIndex() + 1]?.lesson ?? null);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly completionMarkerPercent = LESSON_COMPLETION_PERCENT;
  readonly playbackRate = this.preferences.playbackRate;
  readonly noteText = signal('');
  readonly isPlaying = signal(false);
  readonly isMuted = signal(false);
  readonly videoError = signal(false);
  readonly justCompleted = signal(false);
  readonly isFullscreen = signal(false);
  readonly isCompleted = computed(() =>
    this.progress.isCompleted(this.courseId(), this.lessonId()),
  );
  readonly seekPercent = computed(() =>
    this.duration() > 0 ? Math.min(100, (this.currentTime() / this.duration()) * 100) : 0,
  );
  readonly currentTimeLabel = computed(() =>
    formatDuration(this.currentTime(), this.numberLocale()),
  );
  readonly durationLabel = computed(() =>
    formatDuration(this.duration() || this.lesson()?.durationSec || 0, this.numberLocale()),
  );

  private lastPersistedPosition = -1;
  private mediaReadyForLesson = false;
  private noteSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingNote: { courseId: string; lessonId: string; text: string } | null = null;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const courseId = params.get('courseId') ?? '';
      const lessonId = params.get('lessonId') ?? '';
      if (courseId !== this.courseId() || lessonId !== this.lessonId()) {
        const previousLesson = this.lesson();
        const video = this.videoElement()?.nativeElement;
        if (video && previousLesson) this.persistPosition(video, true);
        this.mediaReadyForLesson = false;
        if (video) resetLessonPlayback(video);
        this.flushNote();
        this.courseId.set(courseId);
        this.lessonId.set(lessonId);
        this.currentTime.set(0);
        this.duration.set(0);
        this.isPlaying.set(false);
        this.videoError.set(false);
        this.justCompleted.set(false);
        this.lastPersistedPosition = -1;
        this.noteText.set(this.notes.getNote(courseId, lessonId));

        const nextLesson = this.lesson();
        if (
          video &&
          video.readyState >= HTMLMediaElement.HAVE_METADATA &&
          previousLesson?.video === nextLesson?.video
        ) {
          this.onMetadata(video);
        }
      }
    });
  }

  ngOnInit(): void {
    this.noteText.set(this.notes.getNote(this.courseId(), this.lessonId()));
    void this.courseData.ensureLoaded().then(() => {
      const course = this.course();
      const lesson = this.lesson();
      if (course && lesson) {
        logDiagnostic('info', 'video', 'lesson-open', {
          courseId: safeRouteId(course.id),
          lessonId: safeRouteId(lesson.id),
          localAsset: lesson.video.split('/').pop() ?? 'unknown-video',
        });
      }
    });
  }

  ngOnDestroy(): void {
    const video = this.videoElement()?.nativeElement;
    if (video && this.lesson()) this.persistPosition(video, true);
    this.flushNote();
  }

  @HostListener('window:pagehide')
  onPageHide(): void {
    const video = this.videoElement()?.nativeElement;
    if (video && this.lesson()) this.persistPosition(video, true);
    this.flushNote();
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen.set(Boolean(document.fullscreenElement));
  }

  formatDuration = (value: number): string => formatDuration(value, this.numberLocale());
  formatNumber = (value: number): string => formatNumber(value, this.numberLocale());

  private numberLocale(): string {
    return this.i18n.language() === 'en' ? 'en-US' : 'ar-EG';
  }

  onMetadata(video: HTMLVideoElement): void {
    const lesson = this.lesson();
    if (!lesson) return;
    if (!this.isExpectedSource(video, lesson.video)) return;
    const mediaDuration =
      Number.isFinite(video.duration) && video.duration > 0 ? video.duration : lesson.durationSec;
    this.duration.set(mediaDuration);
    this.isMuted.set(video.muted);
    video.playbackRate = this.preferences.playbackRate();
    const savedPosition = Math.min(
      this.progress.getPosition(this.courseId(), lesson.id),
      Math.max(0, mediaDuration - 0.25),
    );
    video.currentTime = savedPosition;
    this.currentTime.set(savedPosition);
    this.lastPersistedPosition = savedPosition;
    this.progress.savePosition(this.courseId(), lesson.id, savedPosition);
    this.mediaReadyForLesson = true;
    logDiagnostic('info', 'video', 'metadata:ready', {
      courseId: safeRouteId(this.courseId()),
      lessonId: safeRouteId(lesson.id),
      durationSec: Math.round(mediaDuration),
      resumed: savedPosition > 0,
    });
  }

  onTimeUpdate(video: HTMLVideoElement): void {
    if (!this.mediaReadyForLesson || !this.lesson()) return;
    this.currentTime.set(video.currentTime);
    const lesson = this.lesson();
    if (!lesson) return;
    const duration =
      Number.isFinite(video.duration) && video.duration > 0 ? video.duration : lesson.durationSec;

    if (!this.isCompleted() && isLessonCompleteAtPosition(video.currentTime, duration)) {
      this.progress.markCompleted(this.courseId(), lesson.id, video.currentTime);
      this.justCompleted.set(true);
      logDiagnostic('info', 'video', 'lesson:completed-at-90-percent', {
        courseId: safeRouteId(this.courseId()),
        lessonId: safeRouteId(lesson.id),
        positionSec: Math.floor(video.currentTime),
        durationSec: Math.round(duration),
      });
    }

    if (Math.abs(video.currentTime - this.lastPersistedPosition) >= 5) {
      this.persistPosition(video, false);
    }
  }

  onPlay(): void {
    this.isPlaying.set(true);
  }

  toggleMute(video: HTMLVideoElement): void {
    video.muted = !video.muted;
    this.isMuted.set(video.muted);
  }
  onPause(video: HTMLVideoElement): void {
    this.isPlaying.set(false);
    if (this.mediaReadyForLesson) this.persistPosition(video, true);
  }

  async togglePlayback(video: HTMLVideoElement): Promise<void> {
    if (video.paused) {
      try {
        await video.play();
        this.isPlaying.set(true);
      } catch (error: unknown) {
        logDiagnostic('warn', 'video', 'play:failure', {
          courseId: safeRouteId(this.courseId()),
          lessonId: safeRouteId(this.lessonId()),
          errorType: error instanceof Error ? error.name : 'UnknownError',
        });
      }
      return;
    }
    video.pause();
  }

  seek(event: Event, video: HTMLVideoElement): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const nextTime = Number(target.value);
    if (!Number.isFinite(nextTime)) return;
    video.currentTime = nextTime;
    this.currentTime.set(nextTime);
    this.persistPosition(video, true);
  }

  changeSpeed(event: Event, video: HTMLVideoElement): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const requestedRate = Number(target.value);
    const validRate = PLAYBACK_RATES.find((rate) => rate === requestedRate);
    if (validRate === undefined) return;
    video.playbackRate = validRate;
    this.preferences.setPlaybackRate(validRate as PlaybackRate);
  }

  onNoteInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) return;
    const text = target.value.slice(0, 4000);
    this.noteText.set(text);
    this.pendingNote = { courseId: this.courseId(), lessonId: this.lessonId(), text };
    if (this.noteSaveTimer) clearTimeout(this.noteSaveTimer);
    this.noteSaveTimer = setTimeout(() => this.flushNote(), 350);
  }

  private flushNote(): void {
    if (this.noteSaveTimer) clearTimeout(this.noteSaveTimer);
    this.noteSaveTimer = null;
    const pending = this.pendingNote;
    this.pendingNote = null;
    if (pending) this.notes.saveNote(pending.courseId, pending.lessonId, pending.text);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyboardShortcut(event: KeyboardEvent): void {
    if (event.key === 'Escape' && document.fullscreenElement) {
      event.preventDefault();
      void this.exitFullscreen('escape');
      return;
    }

    const action = resolvePlayerShortcut(
      event.key,
      event.code,
      isInteractiveKeyboardTarget(event.target),
    );
    if (!action || !this.lesson() || this.videoError()) return;
    const video = this.videoElement()?.nativeElement;
    if (!video) return;

    event.preventDefault();
    if (action === 'toggle-playback') {
      void this.togglePlayback(video);
      return;
    }

    const nextTime = seekPosition(
      video.currentTime,
      video.duration,
      action === 'seek-back' ? -1 : 1,
    );
    video.currentTime = nextTime;
    this.currentTime.set(nextTime);
    this.persistPosition(video, true);
    logDiagnostic('info', 'video', 'keyboard:seek', {
      courseId: safeRouteId(this.courseId()),
      lessonId: safeRouteId(this.lessonId()),
      direction: action === 'seek-back' ? 'back' : 'forward',
      positionSec: Math.floor(nextTime),
    });
  }

  onEnded(video: HTMLVideoElement): void {
    if (!this.mediaReadyForLesson || !video.ended) return;
    const lesson = this.lesson();
    if (!lesson) return;
    const finishedAt = Number.isFinite(video.duration) ? video.duration : lesson.durationSec;
    this.currentTime.set(finishedAt);
    this.progress.markCompleted(this.courseId(), lesson.id, finishedAt);
    this.justCompleted.set(true);
  }

  onVideoError(video: HTMLVideoElement): void {
    const lesson = this.lesson();
    if (!video.error || !lesson) return;
    if (video.currentSrc && !this.isExpectedSource(video, lesson.video)) return;
    this.videoError.set(true);
    logDiagnostic('error', 'video', 'asset:failure', {
      courseId: safeRouteId(this.courseId()),
      lessonId: safeRouteId(this.lessonId()),
      asset: lesson?.video.split('/').pop() ?? 'unknown-video',
      mediaErrorCode: video.error.code,
    });
  }

  retryVideo(video: HTMLVideoElement): void {
    this.videoError.set(false);
    video.load();
  }

  isUnlocked(lessonId: string): boolean {
    const course = this.course();
    return course ? isLessonUnlocked(course, lessonId, this.progress.completedKeys()) : false;
  }

  isCurrent(lessonId: string): boolean {
    return this.lessonId() === lessonId;
  }
  isLessonCompleted(lessonId: string): boolean {
    return this.progress.isCompleted(this.courseId(), lessonId);
  }

  async toggleFullscreen(container: HTMLElement): Promise<void> {
    if (document.fullscreenElement) {
      await this.exitFullscreen('control');
      return;
    }

    const startedAt = performance.now();
    const courseId = safeRouteId(this.courseId());
    const lessonId = safeRouteId(this.lessonId());
    logDiagnostic('info', 'video', 'fullscreen:enter:start', { courseId, lessonId });
    try {
      await container.requestFullscreen();
      logDiagnostic('info', 'video', 'fullscreen:enter:success', {
        courseId,
        lessonId,
        durationMs: Math.round(performance.now() - startedAt),
      });
    } catch (error: unknown) {
      logDiagnostic('warn', 'video', 'fullscreen:enter:failure', {
        courseId,
        lessonId,
        durationMs: Math.round(performance.now() - startedAt),
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }

  private async exitFullscreen(source: 'control' | 'escape'): Promise<void> {
    const startedAt = performance.now();
    const courseId = safeRouteId(this.courseId());
    const lessonId = safeRouteId(this.lessonId());
    logDiagnostic('info', 'video', 'fullscreen:exit:start', {
      courseId,
      lessonId,
      source,
    });

    try {
      await document.exitFullscreen();
      logDiagnostic('info', 'video', 'fullscreen:exit:success', {
        courseId,
        lessonId,
        source,
        durationMs: Math.round(performance.now() - startedAt),
      });
    } catch (error: unknown) {
      logDiagnostic('warn', 'video', 'fullscreen:exit:failure', {
        courseId,
        lessonId,
        source,
        durationMs: Math.round(performance.now() - startedAt),
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }

  navigateToNext(): void {
    if (!this.isCompleted()) return;
    const next = this.nextLesson();
    if (next) {
      void this.router.navigate(['/courses', this.courseId(), 'lessons', next.id]);
    } else {
      void this.router.navigate(['/courses', this.courseId()]);
    }
  }

  private persistPosition(video: HTMLVideoElement, force: boolean): void {
    const lesson = this.lesson();
    if (!lesson || !Number.isFinite(video.currentTime)) return;
    if (!force && Math.abs(video.currentTime - this.lastPersistedPosition) < 5) return;
    this.lastPersistedPosition = video.currentTime;
    this.progress.savePosition(this.courseId(), lesson.id, video.currentTime);
  }

  private isExpectedSource(video: HTMLVideoElement, expectedPath: string): boolean {
    const currentSource = video.currentSrc;
    if (!currentSource) return false;
    try {
      return (
        new URL(currentSource, document.baseURI).pathname ===
        new URL(expectedPath, document.baseURI).pathname
      );
    } catch {
      return false;
    }
  }
}
