export const listUserSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    pageIndex: {
      type: 'integer',
      minimum: 1,
    },
    take: {
      type: 'integer',
      minimum: 1,
    },
    skip: {
      type: 'integer',
    },
    sort: {
      type: 'string',
    },
    keyword: {
      type: 'string',
      maxLength: 250,
    },
  },
};

export const createUserSchema: AjvSchema = {
  type: 'object',
  required: ['username', 'password', 'email', 'fullName', 'mobile', 'roleId'],
  additionalProperties: false,
  properties: {
    username: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
    password: {
      type: 'string',
      minLength: 6,
      maxLength: 255,
    },
    email: {
      type: 'string',
      format: 'email',
      minLength: 1,
      maxLength: 255,
    },
    fullName: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
    mobile: {
      pattern: '^[0-9]{9,11}$',
      minLength: 1,
      maxLength: 20,
    },
    roleId: {
      type: 'number',
    },
  },
};

export const updateSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    fullName: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
    mobile: {
      pattern: '^[0-9]{9,11}$',
      minLength: 1,
      maxLength: 20,
    },
    roleId: {
      type: 'number',
    },
  },
};

export const updateStatusSchema: AjvSchema = {
  type: 'object',
  required: ['status'],
  additionalProperties: false,
  properties: {
    status: {
      type: 'integer',
    },
  },
};

export const updatePasswordSchema: AjvSchema = {
  type: 'object',
  required: ['oldPassword', 'newPassword'],
  additionalProperties: false,
  properties: {
    newPassword: {
      type: 'string',
      minLength: 6,
      maxLength: 50,
    },
    oldPassword: {
      type: 'string',
      minLength: 6,
      maxLength: 50,
    },
  },
};
