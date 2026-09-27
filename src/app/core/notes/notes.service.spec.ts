import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NotesService } from './notes.service';

const STORAGE_KEY = 'thaheen-offline-lms-notes-v1';

describe('NotesService', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.removeItem(STORAGE_KEY);
  });

  it('stores notes by course and lesson and restores them after service recreation', () => {
    TestBed.inject(NotesService).saveNote(
      'movement-system',
      'bone-structure',
      'Review the diagram',
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const restored = TestBed.inject(NotesService);
    expect(restored.getNote('movement-system', 'bone-structure')).toBe('Review the diagram');
    expect(restored.getNote('movement-system', 'joint-types')).toBe('');
  });

  it('removes a note when its text is cleared', () => {
    const service = TestBed.inject(NotesService);
    service.saveNote('movement-system', 'bone-structure', 'A note');
    service.saveNote('movement-system', 'bone-structure', '   ');
    expect(service.getNote('movement-system', 'bone-structure')).toBe('');
  });
});
