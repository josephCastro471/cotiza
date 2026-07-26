import { describe, it, expect, beforeEach } from 'vitest';
import { guardarSesion, leerSesion, borrarSesion, TOKEN_KEY, USUARIO_KEY } from './client';

describe('almacenamiento de sesión', () => {
  beforeEach(() => localStorage.clear());

  it('guarda y lee el token y el usuario', () => {
    guardarSesion('token-123', { id: 'u1', rol: 'ADMIN' });
    const sesion = leerSesion();
    expect(sesion.token).toBe('token-123');
    expect(sesion.usuario.rol).toBe('ADMIN');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-123');
    expect(JSON.parse(localStorage.getItem(USUARIO_KEY)).id).toBe('u1');
  });

  it('devuelve token y usuario nulos si no hay sesión guardada', () => {
    expect(leerSesion()).toEqual({ token: null, usuario: null });
  });

  it('borra la sesión', () => {
    guardarSesion('token-123', { id: 'u1' });
    borrarSesion();
    expect(leerSesion()).toEqual({ token: null, usuario: null });
  });
});
