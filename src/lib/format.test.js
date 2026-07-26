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

  it('formatea un Date object sin cambios de día por timezone', () => {
    // Crear un Date para julio 14, 2026 a las 8pm (20:00) hora local
    // Esto asegura que incluso en timezones con UTC offset negativo (como Ecuador UTC-5),
    // la fecha mostrada siga siendo 14 jul (no 15 jul del siguiente día UTC)
    const dateJuly14Evening = new Date(2026, 6, 14, 20, 0, 0);
    expect(formatDate(dateJuly14Evening)).toBe('14 jul 2026');

    // También probar con inicio del día
    const dateJuly14Morning = new Date(2026, 6, 14, 0, 0, 0);
    expect(formatDate(dateJuly14Morning)).toBe('14 jul 2026');
  });
});
