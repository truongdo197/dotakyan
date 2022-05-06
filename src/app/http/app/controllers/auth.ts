import { Request } from 'express';
import { APP, Get, Post, Put } from '$helpers/decorator';
import { done, ErrorHandler, ErrorHandlerController } from '$helpers/response';
import {
  LoginRequest,
  ChangePasswordRequest,
  RequestTokenRequest,
  RequestVerificationCode,
  RegisterRequest,
  ForgotPasswordRequest,
} from '$interfaces/app.auth';
import { validate } from '$helpers/ajv';
import {
  loginSchema,
  changePasswordSchema,
  requestVerificationCodeSchema,
  checkPhoneNumberSchema,
  registerSchema,
  getUuidForgotSchema,
  forgotPasswordSchema,
} from '$app/validators/auth';
import log from '$helpers/log';
const logger = log('Auth CMS controller');
import * as service from '$app/services/auth';
import { checkRefreshToken, updateProfileAuthentication } from '$middlewares/app';
import { ErrorCode } from '$enums/common';

@APP('/auth')
export default class APPAuthController {
  @Post('/login', [])
  async login(req: LoginRequest) {
    const body = req.body;
    validate(loginSchema, body);
    return await service.login(body);
  }

  @Post('/register', [])
  async register(req: RegisterRequest) {
    const body = req.body;
    validate(registerSchema, body);
    return await service.register(body);
  }

  @Post('/request-verification-code', [])
  async requestVerificationCode(req: RequestVerificationCode) {
    const { phone, type } = req.body;
    validate(requestVerificationCodeSchema, { phone, type });
    return await service.requestVerificationCode(phone, type);
  }

  @Post('/is-phone-exist', [])
  async isPhoneNumberExist(req: RequestVerificationCode) {
    const { phone } = req.body;
    validate(checkPhoneNumberSchema, { phone });
    const isExist = await service.isPhoneNumberExist(phone);
    return { isExist };
  }

  /**
   * URL: {{domain}}/v1/cms/auth/change-password
   * This API require access token.
   */
  @Put('/change-password', [updateProfileAuthentication])
  async changePassword(req: ChangePasswordRequest) {
    const { memberId, body } = req;
    validate(changePasswordSchema, body);
    return await service.changePassword(memberId, body);
  }

  /**
   * URL: {{domain}}/v1/cms/auth/request-access-token
   * This API require refresh token in the body.
   */
  @Post('/request-access-token', [checkRefreshToken])
  async requestAccessToken(req: RequestTokenRequest) {
    const memberId = req.memberId;
    if (!memberId) throw ErrorCode.Invalid_Input;

    const accessToken = await service.createAccessToken(memberId);
    return { accessToken };
  }

  @Post('/forgot-password', [])
  async forgotPassword(req: ForgotPasswordRequest) {
    const body = req.body;
    validate(forgotPasswordSchema, body);
    await service.forgotPassword(body);
    return;
  }

  @Post('/forgot-code-valid', [])
  async createUuidVerificationCode(req: Request) {
    const body = req.body;
    validate(getUuidForgotSchema, body);
    return await service.checkValidForgotToken(body);
  }
}
