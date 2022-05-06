export const listGroupSchema: AjvSchema = {
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
    meetingStatus: {
      type: 'string',
      enum: ['', '0', '1', '2', '3'],
    },
  },
};

export const updateStatusGroupSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    status: {
      type: 'number',
      enum: [0, 1],
    },
  },
};
