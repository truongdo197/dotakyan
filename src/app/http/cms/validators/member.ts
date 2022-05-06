export const listMemberSchema: AjvSchema = {
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
    startingAge: {
      type: 'string',
      pattern: '^[1-9]\\d*$',
    },
    endAge: {
      type: 'string',
      pattern: '^[1-9]\\d*$',
    },
    jobId: {
      type: 'string',
    },
    gender: {
      type: 'string',
      enum: ['1', '2', '3'],
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
