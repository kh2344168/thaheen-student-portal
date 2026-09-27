import { describe, expect, it } from 'vitest';
import {
  isInteractiveKeyboardTarget,
  resolvePlayerShortcut,
  seekPosition,
} from './player-shortcuts';

describe('player keyboard shortcuts', () => {
  it('maps Space and arrow keys to player actions', () => {
    expect(resolvePlayerShortcut(' ', 'Space', false)).toBe('toggle-playback');
    expect(resolvePlayerShortcut('ArrowLeft', 'ArrowLeft', false)).toBe('seek-back');
    expect(resolvePlayerShortcut('ArrowRight', 'ArrowRight', false)).toBe('seek-forward');
  });

  it('does not intercept keys while the user is editing or using a control', () => {
    expect(resolvePlayerShortcut(' ', 'Space', true)).toBeNull();
    expect(resolvePlayerShortcut('ArrowRight', 'ArrowRight', true)).toBeNull();
  });

  it('recognizes focus within nested interactive elements', () => {
    const button = document.createElement('button');
    const icon = document.createElement('span');
    button.append(icon);
    expect(isInteractiveKeyboardTarget(icon)).toBe(true);
    expect(isInteractiveKeyboardTarget(document.body)).toBe(false);
  });

  it('seeks in five-second steps and clamps to the media duration', () => {
    expect(seekPosition(20, 95, -1)).toBe(15);
    expect(seekPosition(93, 95, 1)).toBe(95);
    expect(seekPosition(2, 95, -1)).toBe(0);
    expect(seekPosition(20, 0, 1)).toBe(0);
  });
});
