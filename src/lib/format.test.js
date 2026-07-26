import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from './format';

describe('formatCurrency', () => {
  it('formatea con separador de miles y símbolo, estilo es-EC', () => {
    expect(formatCurrency(1248.5)).toBe('$ 1.248,50');
    expect(formatCurrency(0)).toBe('$ 0,00');
    expect(formatCurrency(18400)).toBe('$ 18.400,00');
  });
});

describe('formatDate', () => {
  it('formatea una fecha como "14 jul 2026"', () => {
    expect(formatDate('2026-07-14T00:00:00.000Z')).toBe('14 jul 2026');
  });
});
