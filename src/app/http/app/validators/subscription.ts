export const buySubscriptionSchema: AjvSchema = {
  type: 'object',
  required: ['subscriptionId'],
  additionalProperties: false,
  properties: {
    subscriptionId: {
      type: 'integer',
    },
  },
};
