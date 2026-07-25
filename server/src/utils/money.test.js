import { describe, it, expect } from 'vitest';
import { calcularSubtotalLinea, calcularTotalesCotizacion } from './money.js';

describe('calcularSubtotalLinea', () => {
  it('applies quantity, unit price and a percentage discount', () => {
    expect(calcularSubtotalLinea({ cantidad: 3, precioUnitario: 10, descuentoPct: 0 })).toBe(30);
    expect(calcularSubtotalLinea({ cantidad: 2, precioUnitario: 100, descuentoPct: 10 })).toBe(180);
  });

  it('rounds to 2 decimals without float drift', () => {
    expect(calcularSubtotalLinea({ cantidad: 3, precioUnitario: 0.1, descuentoPct: 0 })).toBe(0.3);
  });
});

describe('calcularTotalesCotizacion', () => {
  it('sums line subtotals and applies IVA on top', () => {
    const lineas = [
      { cantidad: 1, precioUnitario: 100, descuentoPct: 0 },
      { cantidad: 2, precioUnitario: 50, descuentoPct: 10 },
    ];
    const { subtotal, iva, total } = calcularTotalesCotizacion(lineas, 15);
    expect(subtotal).toBe(190);
    expect(iva).toBe(28.5);
    expect(total).toBe(218.5);
  });

  it('returns zeros for an empty line list', () => {
    expect(calcularTotalesCotizacion([], 15)).toEqual({ subtotal: 0, iva: 0, total: 0 });
  });
});
