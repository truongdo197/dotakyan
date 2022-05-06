export const loginSchema: AjvSchema = {
  type: 'object',
  required: ['username', 'password'],
  additionalProperties: false,
  properties: {
    username: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
    },
    password: {
      type: 'string',
      minLength: 6,
      maxLength: 255,
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
