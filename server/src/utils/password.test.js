import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password utils', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('clave-segura-123');
    expect(hash).not.toBe('clave-segura-123');
    expect(await verifyPassword('clave-segura-123', hash)).toBe(true);
    expect(await verifyPassword('otra-clave', hash)).toBe(false);
  });
});
