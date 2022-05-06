export const listKenSchema: AjvSchema = {
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

export const addKenSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      maxLength: 255,
      minLength: 1,
    },
    order: {
      type: 'number',
    },
  },
};

export const updateKenSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      maxLength: 255,
      minLength: 1,
    },
    order: {
      type: 'number',
    },
  },
};

export const updateStatusKenSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    status: {
      type: 'number',
    },
  },
};
