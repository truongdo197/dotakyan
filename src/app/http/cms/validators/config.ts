export const listConfigSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    order: {
      type: 'string',
      pattern: '^[0-9]\\d*$',
    },
    keyword: {
      type: 'string',
      maxLength: 250,
    },
  },
};

export const updateConfigSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      maxLength: 255,
      minLength: 1,
    },
    value: {
      type: 'string',
    },
    type: {
      type: 'string',
      maxLength: 50,
    },
    order: {
      type: 'number',
    },
    metadata: {
      type: 'string',
    },
    isSystem: {
      type: 'number',
    },
  },
};
