export const searchMemberSchema: AjvSchema = {
  type: 'object',
  required: ['lat', 'lng'],
  additionalProperties: false,
  properties: {
    lat: {
      type: 'number',
    },
    lng: {
      type: 'number',
    },
    distance: {
      type: ['number', 'null'],
      minimum: 0,
    },
    pageIndex: {
      type: ['number', 'null'],
      minimum: 0,
    },
    take: {
      type: ['number', 'null'],
      minimum: 0,
    },
    skip: {
      type: ['number', 'null'],
    },
    age: {
      type: ['number', 'null'],
    },
    jobId: {
      type: ['number', 'null'],
    },
    jobsFollow: {
      type: 'array',
      items: {
        type: 'number',
        minimum: 1,
      },
    },
  },
};

export const searchGroupSchema: AjvSchema = {
  type: 'object',
  required: ['lat', 'lng'],
  additionalProperties: false,
  properties: {
    lat: {
      type: 'number',
    },
    lng: {
      type: 'number',
    },
    distance: {
      type: ['number', 'null'],
      minimum: 0,
    },
    pageIndex: {
      type: ['number', 'null'],
      minimum: 0,
    },
    take: {
      type: ['number', 'null'],
      minimum: 0,
    },
    skip: {
      type: ['number', 'null'],
    },
    timeStart: {
      format: 'ISOString',
    },
    timeEnd: {
      format: 'ISOString',
    },
    keyword: {
      type: 'string',
    },
  },
};

export const searchMapSchema: AjvSchema = {
  type: 'object',
  required: ['lat', 'lng'],
  additionalProperties: false,
  properties: {
    lat: {
      type: 'number',
    },
    lng: {
      type: 'number',
    },
    pageIndex: {
      type: 'number',
      minimum: 0,
    },
    take: {
      type: 'number',
      minimum: 0,
    },
    skip: {
      type: 'number',
    },
    distance: {
      type: ['number', 'null'],
      minimum: 0,
    },
  },
};
