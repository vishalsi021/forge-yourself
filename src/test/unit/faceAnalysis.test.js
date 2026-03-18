import { describe, expect, it } from 'vitest';

import { suggestFaceShapeFromFrame } from '@/utils/faceAnalysis';

describe('face analysis helpers', () => {
  it('returns a low-confidence framing suggestion for wide portraits', () => {
    const result = suggestFaceShapeFromFrame({ width: 1200, height: 1300 });

    expect(result.shape).toBe('Round');
    expect(result.confidence).toBe('low');
  });

  it('falls back safely when image metadata is missing', () => {
    const result = suggestFaceShapeFromFrame({ width: 0, height: 0 });

    expect(result.shape).toBe('Oval');
    expect(result.basis.toLowerCase()).toContain('manually');
  });
});
