import { MessageType } from '$enums/common';
import { getEnumValues } from '$helpers/utils';

export const createGroupChatSchema: AjvSchema = {
  type: 'object',
  required: ['locationName', 'lat', 'lng', 'timeStart', 'timeEnd', 'memberMax', 'description', 'groupName'],
  additionalProperties: false,
  properties: {
    locationName: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
    },
    lat: {
      type: 'number',
    },
    lng: {
      type: 'number',
    },
    timeStart: {
      format: 'ISOString',
    },
    timeEnd: {
      format: 'ISOString',
    },
    memberMax: {
      type: 'integer',
    },
    description: {
      type: 'string',
      maxLength: 500,
    },
    groupName: {
      type: 'string',
      maxLength: 500,
    },
  },
};

export const listConversationSchema: AjvSchema = {
  type: 'object',
  required: ['lastTimeSent'],
  additionalProperties: false,
  properties: {
    lastTimeSent: {
      format: 'ISOString',
    },
  },
};

export const sendMessageSchema: AjvSchema = {
  type: 'object',
  required: ['conversationId', 'body', 'messageType', 'image'],
  additionalProperties: false,
  properties: {
    conversationId: {
      type: 'number',
    },
    body: {
      type: 'string',
      maxLength: 10000,
      minLength: 1,
    },
    image: {
      type: 'string',
      maxLength: 1000,
    },
    messageType: {
      enum: [MessageType.TEXT],
    },
  },
};

export const sendImageMessageSchema: AjvSchema = {
  type: 'object',
  required: ['conversationId', 'body', 'messageType', 'image'],
  additionalProperties: false,
  properties: {
    conversationId: {
      type: 'number',
    },
    body: {
      type: 'string',
      maxLength: 10000,
    },
    image: {
      type: 'string',
      maxLength: 1000,
      minLength: 1,
    },
    messageType: {
      enum: [MessageType.IMAGE],
    },
  },
};

export const inviteMemberSchema: AjvSchema = {
  type: 'object',
  required: ['conversationId', 'targetId'],
  additionalProperties: false,
  properties: {
    conversationId: {
      type: 'number',
      minimum: 1,
    },
    targetId: {
      type: 'number',
      minimum: 1,
    },
  },
};

export const requestJoinConversationSchema: AjvSchema = {
  type: 'object',
  required: ['conversationId'],
  additionalProperties: false,
  properties: {
    conversationId: {
      type: 'number',
      minimum: 1,
    },
  },
};

export const approvedRequestSchema: AjvSchema = {
  type: 'object',
  required: ['targetId', 'conversationId'],
  additionalProperties: false,
  properties: {
    targetId: {
      type: 'number',
      minimum: 1,
    },
    conversationId: {
      type: 'number',
      minimum: 1,
    },
  },
};

export const acceptJoinGroupSchema: AjvSchema = {
  type: 'object',
  required: ['conversationId'],
  additionalProperties: false,
  properties: {
    conversationId: {
      type: 'number',
      minimum: 1,
    },
  },
};

export const updateGroupInformationSchema: AjvSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    locationName: {
      type: 'string',
    },
    lat: {
      type: 'number',
    },
    lng: {
      type: 'number',
    },
    timeStart: {
      format: 'ISOString',
    },
    timeEnd: {
      format: 'ISOString',
    },
    memberMax: {
      type: 'number',
      minimum: 0,
    },
    description: {
      type: 'string',
      minLength: 1,
    },
    groupName: {
      type: 'string',
      minLength: 1,
    },
  },
};

export const leaveGroupSchema: AjvSchema = {
  type: 'object',
  required: ['groupId'],
  additionalProperties: false,
  properties: {
    groupId: {
      type: 'number',
      minimum: 1,
    },
  },
};

export const commonActionGroupSchema: AjvSchema = {
  type: 'object',
  required: ['conversationId'],
  additionalProperties: false,
  properties: {
    targetId: {
      type: 'number',
      minimum: 1,
    },
    conversationId: {
      type: 'number',
      minimum: 1,
    },
  },
};
