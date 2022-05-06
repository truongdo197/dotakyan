import { Request } from 'express';

export interface LoginParams {
  phone: string;
  password: string;
}

export interface RegisterParams {
  phone: string;
  password: string;
  code: string;
}

export interface Token {
  token: string;
  refreshToken: string;
}

export interface ILoginResult extends Token {
  process: number;
  memberId: number;
}

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

export interface LoginRequest extends Request {
  body: LoginParams;
}

export interface RegisterRequest extends Request {
  body: RegisterParams;
}

export interface RequestVerificationCode extends Request {
  body: {
    phone: string;
    type: number;
  };
}

export interface RequestTokenRequest extends Request {
  body: {
    refreshToken: string;
  };
}

export interface ForgotPasswordRequest extends Request {
  body: ForgotPasswordParams;
}

export interface ForgotPasswordParams {
  code: string;
  phone: string;
  newPassword: string;
}

export interface ChangePasswordRequest extends Request {
  body: ChangePasswordParams;
}
