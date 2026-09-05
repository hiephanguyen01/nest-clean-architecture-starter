import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { IdGenerator } from '../../shared/application/ports/id-generator.js';

@Injectable()
export class RandomUuidGenerator implements IdGenerator {
  next(): string {
    return randomUUID();
  }
}
