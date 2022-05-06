import { Gender, NotificationStatus, ShareLocationStatus } from '$enums/common';
import { getEnumValues } from '$helpers/utils';

export const updateProfileSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
    introduce: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
    },
    avatar: {
      type: 'string',
      minLength: 0,
      maxLength: 500,
    },
    gender: {
      enum: getEnumValues(Gender),
    },
    jobId: {
      type: 'number',
      minimum: 1,
    },
    kenId: {
      type: 'number',
      minimum: 1,
    },
    address: {
      type: 'string',
    },
    position: {
      type: 'string',
      maxLength: 255,
    },
    birthday: {
      format: 'date',
    },
    jobsFollow: {
      type: 'array',
      items: {
        type: 'integer',
        minimum: 1,
      },
      minItems: 1,
    },
    favoritePlace: {
      type: 'array',
      items: {
        type: 'object',
        required: ['namePlace', 'description', 'lat', 'lng'],
        additionalProperties: false,
        properties: {
          id: {
            type: 'number',
            minimum: 1,
          },
          namePlace: {
            type: 'string',
            minLength: 1,
            maxLength: 500,
          },
          description: {
            type: 'string',
            minLength: 1,
            maxLength: 500,
          },
          lat: {
            type: ['number', 'string'],
          },
          lng: {
            type: ['number', 'string'],
          },
        },
      },
    },
  },
};

export const updateGeoLocation: AjvSchema = {
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
  },
};

export const addFollowJob: AjvSchema = {
  type: 'object',
  required: ['jobIds'],
  additionalProperties: false,
  properties: {
    jobIds: {
      type: 'array',
      items: {
        type: 'number',
        minimum: 0,
      },
      minItems: 1,
    },
  },
};

export const updateSettingNotificationSchema: AjvSchema = {
  type: 'object',
  required: ['notificationStatus'],
  additionalProperties: false,
  properties: {
    notificationStatus: {
      enum: getEnumValues(NotificationStatus),
    },
  },
};

export const updateShareLocationStatus: AjvSchema = {
  type: 'object',
  required: ['shareLocationStatus', 'shareLocationExpire'],
  additionalProperties: false,
  properties: {
    shareLocationStatus: {
      enum: getEnumValues(ShareLocationStatus),
    },
    shareLocationExpire: {
      format: 'ISOString',
    },
  },
};
