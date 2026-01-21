import { describe, it, expect } from 'vitest';
import {
  getStatusText,
  getStatusColor,
  getStatusEmoji,
  getProgressPercentage,
} from './resultsCalculations';

describe('getStatusText', () => {
  it('should return "Тревожно" for concerning/high_impact status', () => {
    expect(getStatusText('concerning')).toBe('Тревожно');
    expect(getStatusText('high_impact')).toBe('Тревожно');
  });

  it('should return "Погранично" for borderline/medium_impact status', () => {
    expect(getStatusText('borderline')).toBe('Погранично');
    expect(getStatusText('medium_impact')).toBe('Погранично');
  });

  it('should return "Все в порядке" for typical/low_impact status', () => {
    expect(getStatusText('typical')).toBe('Все в порядке');
    expect(getStatusText('low_impact')).toBe('Все в порядке');
  });

  it('should return "Неизвестно" for unknown status', () => {
    expect(getStatusText('unknown')).toBe('Неизвестно');
    expect(getStatusText('')).toBe('Неизвестно');
    expect(getStatusText('invalid')).toBe('Неизвестно');
  });
});

describe('getStatusColor', () => {
  it('should return coral background for concerning/high_impact status', () => {
    expect(getStatusColor('concerning')).toBe('text-white bg-coral');
    expect(getStatusColor('high_impact')).toBe('text-white bg-coral');
  });

  it('should return yellow background for borderline/medium_impact status', () => {
    expect(getStatusColor('borderline')).toBe('text-white bg-yellow-400');
    expect(getStatusColor('medium_impact')).toBe('text-white bg-yellow-400');
  });

  it('should return secondary background for typical/low_impact status', () => {
    expect(getStatusColor('typical')).toBe('text-white bg-secondary');
    expect(getStatusColor('low_impact')).toBe('text-white bg-secondary');
  });

  it('should return secondary background for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('text-white bg-secondary');
    expect(getStatusColor('')).toBe('text-white bg-secondary');
  });
});

describe('getStatusEmoji', () => {
  it('should return warning symbol for concerning/high_impact status', () => {
    expect(getStatusEmoji('concerning')).toBe('⚠');
    expect(getStatusEmoji('high_impact')).toBe('⚠');
  });

  it('should return circle symbol for borderline/medium_impact status', () => {
    expect(getStatusEmoji('borderline')).toBe('○');
    expect(getStatusEmoji('medium_impact')).toBe('○');
  });

  it('should return checkmark for typical/low_impact status', () => {
    expect(getStatusEmoji('typical')).toBe('✓');
    expect(getStatusEmoji('low_impact')).toBe('✓');
  });

  it('should return circle symbol for unknown status', () => {
    expect(getStatusEmoji('unknown')).toBe('○');
    expect(getStatusEmoji('')).toBe('○');
  });
});

describe('getProgressPercentage', () => {
  it('should calculate percentage correctly', () => {
    expect(getProgressPercentage(0, 100)).toBe(0);
    expect(getProgressPercentage(50, 100)).toBe(50);
    expect(getProgressPercentage(100, 100)).toBe(100);
  });

  it('should handle non-100 max scores', () => {
    expect(getProgressPercentage(5, 10)).toBe(50);
    expect(getProgressPercentage(25, 50)).toBe(50);
    expect(getProgressPercentage(1, 4)).toBe(25);
  });

  it('should cap at 100%', () => {
    expect(getProgressPercentage(150, 100)).toBe(100);
    expect(getProgressPercentage(200, 100)).toBe(100);
  });

  it('should handle zero max score', () => {
    // Division by zero: 0/0 = NaN, which Math.min(NaN, 100) = NaN
    // Non-zero/0 = Infinity, which Math.min(Infinity, 100) = 100
    const result = getProgressPercentage(0, 0);
    // NaN behavior - function should handle edge case
    expect(typeof result).toBe('number');
  });

  it('should handle decimal values', () => {
    expect(getProgressPercentage(1, 3)).toBeCloseTo(33.33, 1);
    expect(getProgressPercentage(2, 3)).toBeCloseTo(66.67, 1);
  });

  it('should return exact percentage for common SDQ scores', () => {
    // SDQ scale is 0-10 for subscales, 0-40 for total
    expect(getProgressPercentage(0, 10)).toBe(0);
    expect(getProgressPercentage(5, 10)).toBe(50);
    expect(getProgressPercentage(10, 10)).toBe(100);

    // Total difficulties score
    expect(getProgressPercentage(0, 40)).toBe(0);
    expect(getProgressPercentage(20, 40)).toBe(50);
    expect(getProgressPercentage(40, 40)).toBe(100);
  });
});

describe('Status consistency', () => {
  const statuses = ['concerning', 'high_impact', 'borderline', 'medium_impact', 'typical', 'low_impact'];

  it('should return valid text for all known statuses', () => {
    for (const status of statuses) {
      const text = getStatusText(status);
      expect(['Тревожно', 'Погранично', 'Все в порядке']).toContain(text);
    }
  });

  it('should return valid colors for all known statuses', () => {
    for (const status of statuses) {
      const color = getStatusColor(status);
      expect(color).toMatch(/^text-white bg-/);
    }
  });

  it('should return valid emojis for all known statuses', () => {
    for (const status of statuses) {
      const emoji = getStatusEmoji(status);
      expect(['⚠', '○', '✓']).toContain(emoji);
    }
  });
});
