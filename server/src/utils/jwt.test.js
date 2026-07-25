import { describe, it, expect, beforeAll } from 'vitest';
import { firmarToken, verificarToken } from './jwt.js';

describe('jwt utils', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '7d';
  });

  it('signs and verifies a token round-trip', () => {
    const token = firmarToken({ sub: 'user-1', empresaId: 'empresa-1', rol: 'ADMIN' });
    const payload = verificarToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.empresaId).toBe('empresa-1');
    expect(payload.rol).toBe('ADMIN');
  });

  it('throws on a tampered token', () => {
    const token = firmarToken({ sub: 'user-1', empresaId: 'empresa-1', rol: 'ADMIN' });
    expect(() => verificarToken(`${token}x`)).toThrow();
  });
});
