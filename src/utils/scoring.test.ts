import { describe, it, expect } from 'vitest';
import {
  createReverseScore,
  createUnreverseScore,
  reverseScore4,
  unreverseScore4,
  reverseScore5,
  unreverseScore5,
  reverseScore3,
  unreverseScore3,
} from './scoring';

describe('createReverseScore', () => {
  it('should create a function that reverses scores', () => {
    const reverse = createReverseScore(4);

    expect(reverse(0)).toBe(4);
    expect(reverse(1)).toBe(3);
    expect(reverse(2)).toBe(2);
    expect(reverse(3)).toBe(1);
    expect(reverse(4)).toBe(0);
  });

  it('should return original value for out-of-range inputs', () => {
    const reverse = createReverseScore(4);

    expect(reverse(-1)).toBe(-1);
    expect(reverse(5)).toBe(5);
    expect(reverse(10)).toBe(10);
  });

  it('should work with different max values', () => {
    const reverse10 = createReverseScore(10);

    expect(reverse10(0)).toBe(10);
    expect(reverse10(5)).toBe(5);
    expect(reverse10(10)).toBe(0);
  });
});

describe('createUnreverseScore', () => {
  it('should create a function that unreverses scores', () => {
    const unreverse = createUnreverseScore(4);

    // Unreverse is mathematically the same as reverse (max - value = max - value)
    expect(unreverse(0)).toBe(4);
    expect(unreverse(1)).toBe(3);
    expect(unreverse(2)).toBe(2);
    expect(unreverse(3)).toBe(1);
    expect(unreverse(4)).toBe(0);
  });

  it('should return original value for out-of-range inputs', () => {
    const unreverse = createUnreverseScore(4);

    expect(unreverse(-1)).toBe(-1);
    expect(unreverse(5)).toBe(5);
  });
});

describe('reverseScore4 (0-4 scale for Checkup)', () => {
  it('should reverse scores correctly', () => {
    expect(reverseScore4(0)).toBe(4);
    expect(reverseScore4(1)).toBe(3);
    expect(reverseScore4(2)).toBe(2);
    expect(reverseScore4(3)).toBe(1);
    expect(reverseScore4(4)).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(reverseScore4(-1)).toBe(-1);
    expect(reverseScore4(5)).toBe(5);
  });
});

describe('unreverseScore4', () => {
  it('should unreverse scores correctly', () => {
    expect(unreverseScore4(0)).toBe(4);
    expect(unreverseScore4(1)).toBe(3);
    expect(unreverseScore4(2)).toBe(2);
    expect(unreverseScore4(3)).toBe(1);
    expect(unreverseScore4(4)).toBe(0);
  });

  it('should be inverse of reverseScore4', () => {
    // Applying reverse then unreverse should return original
    for (let i = 0; i <= 4; i++) {
      expect(unreverseScore4(reverseScore4(i))).toBe(i);
    }
  });
});

describe('reverseScore5 (0-5 scale for Family)', () => {
  it('should reverse scores correctly', () => {
    expect(reverseScore5(0)).toBe(5);
    expect(reverseScore5(1)).toBe(4);
    expect(reverseScore5(2)).toBe(3);
    expect(reverseScore5(3)).toBe(2);
    expect(reverseScore5(4)).toBe(1);
    expect(reverseScore5(5)).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(reverseScore5(-1)).toBe(-1);
    expect(reverseScore5(6)).toBe(6);
  });
});

describe('unreverseScore5', () => {
  it('should unreverse scores correctly', () => {
    expect(unreverseScore5(0)).toBe(5);
    expect(unreverseScore5(5)).toBe(0);
  });

  it('should be inverse of reverseScore5', () => {
    for (let i = 0; i <= 5; i++) {
      expect(unreverseScore5(reverseScore5(i))).toBe(i);
    }
  });
});

describe('reverseScore3 (0-3 scale for Parent)', () => {
  it('should reverse scores correctly', () => {
    expect(reverseScore3(0)).toBe(3);
    expect(reverseScore3(1)).toBe(2);
    expect(reverseScore3(2)).toBe(1);
    expect(reverseScore3(3)).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(reverseScore3(-1)).toBe(-1);
    expect(reverseScore3(4)).toBe(4);
  });
});

describe('unreverseScore3', () => {
  it('should unreverse scores correctly', () => {
    expect(unreverseScore3(0)).toBe(3);
    expect(unreverseScore3(3)).toBe(0);
  });

  it('should be inverse of reverseScore3', () => {
    for (let i = 0; i <= 3; i++) {
      expect(unreverseScore3(reverseScore3(i))).toBe(i);
    }
  });
});

describe('Symmetry property', () => {
  it('should maintain symmetry: reverse(reverse(x)) = x', () => {
    // For all scales, applying reverse twice should return original
    for (let i = 0; i <= 4; i++) {
      expect(reverseScore4(reverseScore4(i))).toBe(i);
    }

    for (let i = 0; i <= 5; i++) {
      expect(reverseScore5(reverseScore5(i))).toBe(i);
    }

    for (let i = 0; i <= 3; i++) {
      expect(reverseScore3(reverseScore3(i))).toBe(i);
    }
  });
});
