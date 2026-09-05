import { describe, expect, it } from 'vitest';
import { InvalidEmailError } from '../errors/invalid-email.error.js';
import { Email } from './email.vo.js';

describe('Email', () => {
  it('normalizes whitespace and case', () => {
    const email = Email.create('  Test.User@Example.COM  ');

    expect(email.value).toBe('test.user@example.com');
  });

  it.each(['', 'plain-text', '@example.com', 'user@', 'user @example.com']) (
    'rejects invalid email %j',
    (value) => {
      expect(() => Email.create(value)).toThrow(InvalidEmailError);
    },
  );

  it('compares canonical values', () => {
    expect(Email.create('USER@example.com').equals(Email.create('user@example.com'))).toBe(true);
  });
});
