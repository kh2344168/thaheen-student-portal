# Thaheen Offline LMS

An Arabic-first, offline learning portal for health-sciences students. Course data, thumbnails, and MP4s are bundled in `src/assets`; the app makes no backend or external API calls.

## Run locally

Tested with Node.js `24.19.0`, npm `11.9.0`, and Angular `22.2.0`.

```bash
npm install
npx ng serve
```

Open `http://localhost:4200/courses`. `npm start` runs the same command.

```bash
npm run build
npm test -- --watch=false
```

## Features

- `/courses`: course cards, progress, the latest unfinished lesson, and search by course, section, lesson, or instructor.
- `/courses/:courseId`: all sections are visible on entry, with lesson durations and statuses, and sequential unlocking across section boundaries.
- `/courses/:courseId/lessons/:lessonId`: custom HTML5 controls, seek, fullscreen, mute/unmute, 1x/1.25x/1.5x/2x speed, resume, a visible 90% completion marker, automatic completion at that threshold, and next lesson.
- Arabic/English switch. The page language and layout direction change together (`ar`/RTL and `en`/LTR).
- Light/dark theme, player keyboard shortcuts (Space and arrow keys), per-lesson notes, and remembered playback speed.
- Progress, notes, theme, language, and playback speed persist in local storage.
- Loading, empty, error, course/lesson not-found, locked lesson, and broken-video states.

## Architecture

- Angular `22.2.0`, standalone components, strict TypeScript, lazy-loaded feature routes, and a functional lesson guard.
- Signals hold the UI and preference state. RxJS is used at the `HttpClient` boundary for loading the bundled `assets/data/courses.json` file.
- `CourseDataService` loads and validates course data. Its only HTTP request is for the local JSON asset.
- `ProgressService`, `NotesService`, and `PreferencesService` isolate local storage behind injectable services so their persistence implementations can be replaced later.
- Pure functions in `core/logic` calculate progress and unlocking, filter courses, and resolve player shortcuts.
- The lesson guard waits for course data, redirects locked lessons to the course page with a friendly message, and lets unknown lesson IDs reach the not-found state.
- Diagnostics record operation outcomes and durations with safe route IDs. They never log note text or the full local-storage contents.

## Bundled content and assumptions

`src/assets/data/courses.json` has two courses, two sections per course, and five lessons per course. Three original, locally rendered 95-second MP4 infographic animations and three SVG thumbnails are bundled in `src/assets`. Each video is Arabic-labeled, 1280×720, and under 2.3 MB. The same clip is reused among lessons in its topic to stay within the 2–3 video constraint; each clip gives a short overview rather than a separate full lecture. The Arabic narration scripts and their medical references are in [`ARABIC-LESSON-SCRIPTS.md`](./ARABIC-LESSON-SCRIPTS.md). bones.mp4 is silent; heart.mp4 and blood.mp4 contain sample English narration. Arabic voiceover is not included in this version.

The animation source is [`tools/render_arabic_lesson_videos.py`](./tools/render_arabic_lesson_videos.py). Re-rendering it requires Pillow with Arabic text shaping and FFmpeg with `libx264`; these are content-authoring tools and are not needed to run the Angular app.

- A lesson completes when its current playback position reaches at least 90% of its duration. Previously watched segments are not accumulated.
- Course progress is completed lessons divided by all lessons in that course.
- Continue Watching selects the most recently updated unfinished lesson.
- Sequential unlocking follows the course-wide lesson order, including section boundaries.
- English course, section, and lesson labels are included with the bundled data. If a translation is missing, the Arabic label is used as a fallback.
- Notes are capped at 4,000 characters and saved separately per lesson.

## Tests

Run `npm test -- --watch=false`. The unit tests cover the 90% completion rule, sequential unlocking, progress percentage, storage recovery, local note and preference persistence, translation selection, course search, shortcut handling, duration formatting, route-guard decisions, and resetting media between lessons. The latest run after the design and audio updates passed **23 tests across 10 files**.

## Trade-offs and known limitations

- There is no account, backend, cross-device sync, or PWA media cache; local storage belongs to the current browser profile.
- Arabic voiceover and timed subtitles are not yet present in this working copy.
- Sample videos are short diagram animations and are reused between lessons on the same topic.
- Keyboard shortcut and browser fullscreen behavior can vary slightly by browser; standard controls remain available.
- An end-to-end browser suite is not included. The build and unit tests were run after the optional features were added.
- **Ideas for more time (not implemented):** replace the synthetic English samples with licensed Arabic health-sciences narration and captions; add optional, brief multiple-choice recall checks at meaningful points in a lesson; and test the bilingual and dark themes across more browsers and mobile devices, including an accessibility review.
- I would validate the recall checks with students before shipping them. I would place them at topic transitions rather than interrupting on a fixed timer, then use learner feedback and results to decide whether any follow-up prompt is useful.

## Time spent

**Approximate focused time:** About 2 focused hours across two days; the time was estimated from the work sessions rather than tracked with a timer.
