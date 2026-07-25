import { describe, it, expect } from 'vitest';
import { puedeTransicionar, siguienteEstado } from './estados.js';

describe('máquina de estados de cotización', () => {
  it('permite BORRADOR --enviar--> ENVIADO', () => {
    expect(puedeTransicionar('BORRADOR', 'enviar')).toBe(true);
    expect(siguienteEstado('BORRADOR', 'enviar')).toBe('ENVIADO');
  });

  it('permite ENVIADO --aprobar--> APROBADO y --rechazar--> RECHAZADO', () => {
    expect(siguienteEstado('ENVIADO', 'aprobar')).toBe('APROBADO');
    expect(siguienteEstado('ENVIADO', 'rechazar')).toBe('RECHAZADO');
  });

  it('permite ENVIADO --devolver--> BORRADOR y --vencer--> VENCIDO', () => {
    expect(siguienteEstado('ENVIADO', 'devolver')).toBe('BORRADOR');
    expect(siguienteEstado('ENVIADO', 'vencer')).toBe('VENCIDO');
  });

  it('no permite enviar un BORRADOR dos veces seguidas sin pasar por ENVIADO', () => {
    expect(puedeTransicionar('ENVIADO', 'enviar')).toBe(false);
  });

  it('no permite ninguna transición desde estados terminales', () => {
    expect(puedeTransicionar('APROBADO', 'enviar')).toBe(false);
    expect(puedeTransicionar('APROBADO', 'aprobar')).toBe(false);
    expect(puedeTransicionar('RECHAZADO', 'rechazar')).toBe(false);
  });

  it('siguienteEstado lanza con code TRANSICION_INVALIDA para una transición no permitida', () => {
    try {
      siguienteEstado('APROBADO', 'enviar');
      throw new Error('no debió llegar aquí');
    } catch (err) {
      expect(err.code).toBe('TRANSICION_INVALIDA');
    }
  });
});
