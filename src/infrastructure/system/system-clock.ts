import { Injectable } from '@nestjs/common';
import { Clock } from '../../shared/application/ports/clock.js';

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
