import { describe, expect, it, vi } from 'vitest';
import { resetLessonPlayback } from './lesson-playback';

describe('resetLessonPlayback', () => {
  it('stops and resets media when the active lesson changes', () => {
    let currentTime = 86;
    let playbackRate = 1.5;
    let paused = false;
    let readyState = 4;
    const video = {
      get paused() {
        return paused;
      },
      pause: vi.fn(() => (paused = true)),
      get readyState() {
        return readyState;
      },
      get currentTime() {
        return currentTime;
      },
      set currentTime(value: number) {
        currentTime = value;
      },
      get playbackRate() {
        return playbackRate;
      },
      set playbackRate(value: number) {
        playbackRate = value;
      },
      load: vi.fn(() => (readyState = 0)),
    } as unknown as HTMLVideoElement;

    resetLessonPlayback(video);

    expect(video.pause).toHaveBeenCalledOnce();
    expect(video.currentTime).toBe(0);
    expect(video.playbackRate).toBe(1);
    expect(video.load).toHaveBeenCalledOnce();
  });

  it('does nothing before the video element exists', () => {
    expect(() => resetLessonPlayback(undefined)).not.toThrow();
  });
});
