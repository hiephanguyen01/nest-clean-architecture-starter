import { Module } from '@nestjs/common';
import { Clock } from '../../shared/application/ports/clock.js';
import { IdGenerator } from '../../shared/application/ports/id-generator.js';
import { RandomUuidGenerator } from './random-uuid-generator.js';
import { SystemClock } from './system-clock.js';

@Module({
  providers: [
    SystemClock,
    RandomUuidGenerator,
    { provide: Clock, useExisting: SystemClock },
    { provide: IdGenerator, useExisting: RandomUuidGenerator },
  ],
  exports: [Clock, IdGenerator],
})
export class SystemModule {}
