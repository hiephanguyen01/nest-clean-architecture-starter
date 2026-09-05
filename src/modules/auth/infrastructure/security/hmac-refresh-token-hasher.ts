import { createHmac, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../infrastructure/config/app-config.service.js';
import { RefreshTokenHasher } from '../../application/ports/refresh-token-hasher.js';

@Injectable()
export class HmacRefreshTokenHasher implements RefreshTokenHasher {
  constructor(@Inject(AppConfigService) private readonly config: AppConfigService) {}

  hash(token: string): string {
    return createHmac('sha256', this.config.refreshTokenHashSecret).update(token).digest('hex');
  }

  verify(token: string, hash: string): boolean {
    const candidate = this.hash(token);
    const left = Buffer.from(candidate, 'hex');
    const right = Buffer.from(hash, 'hex');
    return left.length === right.length && timingSafeEqual(left, right);
  }
}
