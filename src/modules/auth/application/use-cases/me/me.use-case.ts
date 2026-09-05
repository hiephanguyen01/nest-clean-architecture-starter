import type { UserOutput } from '../../../../users/application/contracts/user-output.js';
import type { GetUserUseCase } from '../../../../users/application/use-cases/get-user/get-user.use-case.js';

export class MeUseCase {
  constructor(private readonly getUser: GetUserUseCase) {}

  execute(userId: string): Promise<UserOutput> {
    return this.getUser.execute({ id: userId });
  }
}
