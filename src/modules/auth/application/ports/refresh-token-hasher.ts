export abstract class RefreshTokenHasher {
  abstract hash(token: string): string;
  abstract verify(token: string, hash: string): boolean;
}
