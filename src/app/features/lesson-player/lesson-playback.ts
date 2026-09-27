export function resetLessonPlayback(video: HTMLVideoElement | undefined): void {
  if (!video) return;
  if (!video.paused) video.pause();
  if (video.readyState > 0) video.currentTime = 0;
  video.playbackRate = 1;
  video.load();
}
