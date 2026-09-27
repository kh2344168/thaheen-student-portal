import { Routes } from '@angular/router';
import { lessonAccessGuard } from './core/guards/lesson-access.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'courses' },
  {
    path: 'courses',
    loadComponent: () =>
      import('./features/courses-list/courses-list.page').then((module) => module.CoursesListPage),
  },
  {
    path: 'courses/:courseId',
    loadComponent: () =>
      import('./features/course-details/course-details.page').then(
        (module) => module.CourseDetailsPage,
      ),
  },
  {
    path: 'courses/:courseId/lessons/:lessonId',
    canActivate: [lessonAccessGuard],
    loadComponent: () =>
      import('./features/lesson-player/lesson-player.page').then(
        (module) => module.LessonPlayerPage,
      ),
  },
  { path: '**', redirectTo: 'courses' },
];
