import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import { PasswordHasher } from '../../application/ports/password-hasher.js';

@Injectable()
export class ArgonPasswordHasher implements PasswordHasher {
  hash(value: string): Promise<string> {
    return argon2.hash(value, { type: argon2.argon2id });
  }

  verify(value: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, value);
  }
}
