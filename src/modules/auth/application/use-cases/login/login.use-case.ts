import type { UserOutput } from '../../../../users/application/contracts/user-output.js';
import { UserNotFoundError } from '../../../../users/application/errors/user-not-found.error.js';
import type { GetUserAuthenticationDataUseCase } from '../../../../users/application/use-cases/get-user-authentication-data/get-user-authentication-data.use-case.js';
import { UserStatus } from '../../../../users/domain/enums/user-status.enum.js';
import { AccountUnavailableError } from '../../errors/account-unavailable.error.js';
import { InvalidCredentialsError } from '../../errors/invalid-credentials.error.js';
import type { PasswordHasher } from '../../ports/password-hasher.js';
import type { AuthTokensOutput, TokenPairIssuer } from '../../services/token-pair-issuer.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: UserOutput;
  tokens: AuthTokensOutput;
}

const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$45FELcyu423Q4HKPQGSmZQ$xyBBNyzcSqZS8BBF/gGfe2HX1t9imHK1nWPHkawLW9o';

export class LoginUseCase {
  constructor(
    private readonly getUserAuthenticationData: GetUserAuthenticationDataUseCase,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenPairIssuer: TokenPairIssuer,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    let user;
    try {
      user = await this.getUserAuthenticationData.execute({ email: input.email });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        await this.passwordHasher.verify(input.password, DUMMY_PASSWORD_HASH);
        throw new InvalidCredentialsError();
      }
      throw error;
    }

    if (!(await this.passwordHasher.verify(input.password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new AccountUnavailableError();
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    const tokens = await this.tokenPairIssuer.issue({ userId: user.id, role: user.role });
    return { user: safeUser, tokens };
  }
}
