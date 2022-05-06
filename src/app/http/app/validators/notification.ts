export const updateGeoLocationSchema: AjvSchema = {
  type: 'object',
  required: ['notificationId'],
  additionalProperties: false,
  properties: {
    notificationId: {
      type: 'number',
      minimum: 0,
    },
  },
};
