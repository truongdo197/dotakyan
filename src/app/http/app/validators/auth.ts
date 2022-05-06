import { VerificationType } from '$enums/common';
import { getEnumValues } from '$helpers/utils';

export const loginSchema: AjvSchema = {
  type: 'object',
  required: ['phone', 'password'],
  additionalProperties: false,
  properties: {
    phone: {
      pattern: '^[0-9]{9,11}$',
      minLength: 1,
      maxLength: 20,
    },
    password: {
      type: 'string',
      minLength: 6,
      maxLength: 255,
    },
  },
};

export const registerSchema: AjvSchema = {
  type: 'object',
  required: ['phone', 'password', 'code'],
  additionalProperties: false,
  properties: {
    phone: {
      pattern: '^[0-9]{9,11}$',
      minLength: 1,
      maxLength: 20,
    },
    password: {
      type: 'string',
      minLength: 6,
      maxLength: 255,
    },
    code: {
      type: 'string',
      minLength: 5,
      maxLength: 5,
    },
  },
};

export const requestAccessTokenSchema: AjvSchema = {
  type: 'object',
  required: ['refreshToken'],
  additionalProperties: false,
  properties: {
    refreshToken: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
  },
};

export const changePasswordSchema: AjvSchema = {
  type: 'object',
  required: ['oldPassword', 'newPassword'],
  additionalProperties: false,
  properties: {
    oldPassword: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
    newPassword: {
      type: 'string',
      minLength: 6,
      maxLength: 255,
    },
  },
};

export const requestVerificationCodeSchema: AjvSchema = {
  type: 'object',
  required: ['phone', 'type'],
  additionalProperties: false,
  properties: {
    phone: {
      pattern: '^[0-9]{9,11}$',
      minLength: 1,
      maxLength: 20,
    },
    type: {
      enum: getEnumValues(VerificationType),
    },
  },
};

export const checkPhoneNumberSchema: AjvSchema = {
  type: 'object',
  required: ['phone'],
  additionalProperties: false,
  properties: {
    phone: {
      pattern: '^[0-9]{9,11}$',
      minLength: 1,
      maxLength: 20,
    },
  },
};

export const forgotPasswordSchema: AjvSchema = {
  type: 'object',
  required: ['phone', 'code', 'newPassword'],
  additionalProperties: false,
  properties: {
    phone: {
      pattern: '^[0-9]{9,11}$',
      minLength: 1,
      maxLength: 20,
    },
    code: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
    },
    newPassword: {
      type: 'string',
      minLength: 6,
      maxLength: 20,
    },
  },
};

export const getUuidForgotSchema: AjvSchema = {
  type: 'object',
  required: ['phone', 'code'],
  additionalProperties: false,
  properties: {
    phone: {
      pattern: '^[0-9]{9,11}$',
      minLength: 1,
      maxLength: 20,
    },
    code: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
    },
  },
};
