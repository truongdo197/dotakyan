export const listResourceSchema: AjvSchema = {
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
    start: {
      type: 'integer',
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
    status: {
      type: 'string',
      enum: ['', '1', '0'],
    },
  },
};

export const addResourceSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      maxLength: 255,
      minLength: 1,
    },
    type: {
      type: 'number',
    },
  },
};

export const updateResourceSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      maxLength: 255,
      minLength: 1,
    },
  },
};

export const updateStatusResourceSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    status: {
      type: 'number',
    },
  },
};
