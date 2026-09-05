import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrors } from '../../../../shared/presentation/swagger/api-common-errors.decorator.js';
import { Roles } from '../../../../shared/presentation/security/security-metadata.js';
import { GetUserUseCase } from '../../application/use-cases/get-user/get-user.use-case.js';
import { UserRole } from '../../domain/enums/user-role.enum.js';
import { UserEnvelopeDto } from '../dto/user-response.dto.js';
import { UserPresenter } from '../presenters/user.presenter.js';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(@Inject(GetUserUseCase) private readonly getUser: GetUserUseCase) {}

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ type: UserEnvelopeDto })
  @ApiCommonErrors()
  async getById(@Param('id') id: string): Promise<UserEnvelopeDto> {
    const user = await this.getUser.execute({ id });
    return { data: UserPresenter.present(user) };
  }
}
