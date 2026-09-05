import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../../../shared/presentation/security/security-metadata.js';
import type { RequestPrincipal } from '../../../../shared/presentation/security/request-principal.js';
import { ApiCommonErrors } from '../../../../shared/presentation/swagger/api-common-errors.decorator.js';
import { LoginUseCase } from '../../application/use-cases/login/login.use-case.js';
import { LogoutUseCase } from '../../application/use-cases/logout/logout.use-case.js';
import { MeUseCase } from '../../application/use-cases/me/me.use-case.js';
import { RefreshUseCase } from '../../application/use-cases/refresh/refresh.use-case.js';
import { RegisterUseCase } from '../../application/use-cases/register/register.use-case.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import {
  AuthSessionEnvelopeDto,
  AuthTokensEnvelopeDto,
  AuthUserEnvelopeDto,
  EmptySuccessEnvelopeDto,
} from '../dto/auth-response.dto.js';
import { LoginRequestDto } from '../dto/login-request.dto.js';
import { LogoutRequestDto } from '../dto/logout-request.dto.js';
import { RefreshRequestDto } from '../dto/refresh-request.dto.js';
import { RegisterRequestDto } from '../dto/register-request.dto.js';
import { AuthPresenter } from '../presenters/auth.presenter.js';

const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } } as const;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(RegisterUseCase) private readonly registerUseCase: RegisterUseCase,
    @Inject(LoginUseCase) private readonly loginUseCase: LoginUseCase,
    @Inject(RefreshUseCase) private readonly refreshUseCase: RefreshUseCase,
    @Inject(LogoutUseCase) private readonly logoutUseCase: LogoutUseCase,
    @Inject(MeUseCase) private readonly meUseCase: MeUseCase,
  ) {}

  @Post('register')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @ApiCreatedResponse({ type: AuthUserEnvelopeDto })
  @ApiConflictResponse({ description: 'Email already exists' })
  @ApiCommonErrors()
  async register(@Body() dto: RegisterRequestDto): Promise<AuthUserEnvelopeDto> {
    const user = await this.registerUseCase.execute(dto);
    return { data: AuthPresenter.user(user) };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  @ApiOkResponse({ type: AuthSessionEnvelopeDto })
  @ApiCommonErrors()
  async login(@Body() dto: LoginRequestDto): Promise<AuthSessionEnvelopeDto> {
    const result = await this.loginUseCase.execute(dto);
    return { data: AuthPresenter.session(result) };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  @ApiOkResponse({ type: AuthTokensEnvelopeDto })
  @ApiCommonErrors()
  async refresh(@Body() dto: RefreshRequestDto): Promise<AuthTokensEnvelopeDto> {
    const result = await this.refreshUseCase.execute(dto);
    return { data: AuthPresenter.tokens(result) };
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  @ApiOkResponse({ type: EmptySuccessEnvelopeDto })
  @ApiCommonErrors()
  async logout(@Body() dto: LogoutRequestDto): Promise<EmptySuccessEnvelopeDto> {
    await this.logoutUseCase.execute(dto);
    return { data: null };
  }

  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: AuthUserEnvelopeDto })
  @ApiCommonErrors()
  async me(@CurrentUser() principal: RequestPrincipal): Promise<AuthUserEnvelopeDto> {
    const user = await this.meUseCase.execute(principal.userId);
    return { data: AuthPresenter.user(user) };
  }
}
