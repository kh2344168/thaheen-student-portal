export type PlayerShortcut = 'toggle-playback' | 'seek-back' | 'seek-forward';

const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, [role="textbox"], [contenteditable]:not([contenteditable="false"])';

export function resolvePlayerShortcut(
  key: string,
  code: string,
  targetIsInteractive: boolean,
): PlayerShortcut | null {
  if (targetIsInteractive) return null;
  if (key === ' ' || code === 'Space') return 'toggle-playback';
  if (key === 'ArrowLeft') return 'seek-back';
  if (key === 'ArrowRight') return 'seek-forward';
  return null;
}

export function isInteractiveKeyboardTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null;
}

export function seekPosition(current: number, duration: number, direction: -1 | 1): number {
  if (!Number.isFinite(current) || !Number.isFinite(duration) || duration <= 0) return 0;
  return Math.max(0, Math.min(duration, current + direction * 5));
}
