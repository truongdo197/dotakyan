import { Request } from 'express';

export interface LoginRequest extends Request {
  body: LoginParams;
}

export interface RequestTokenRequest extends Request {
  body: {
    refreshToken: string;
  };
}

export interface ChangePasswordRequest extends Request {
  body: ChangePasswordParams;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

export interface Token {
  token: string;
  refreshToken: string;
}
