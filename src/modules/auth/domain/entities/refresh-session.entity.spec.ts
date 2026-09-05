import { describe, expect, it } from 'vitest';
import { RefreshSession } from './refresh-session.entity.js';

describe('RefreshSession', () => {
  it('is active only before expiry and before revocation', () => {
    const session = RefreshSession.create({
      id: '6cc85d90-6321-4d11-b086-d24afdc7627a',
      userId: '9d4fa61e-d2cf-4c58-8dbd-dce4220df511',
      tokenHash: 'hash',
      expiresAt: new Date('2026-09-06T00:00:00.000Z'),
      now: new Date('2026-09-05T00:00:00.000Z'),
    });

    expect(session.isActive(new Date('2026-09-05T12:00:00.000Z'))).toBe(true);
    session.revoke(new Date('2026-09-05T13:00:00.000Z'), 'replacement');
    expect(session.isActive(new Date('2026-09-05T14:00:00.000Z'))).toBe(false);
  });
});
