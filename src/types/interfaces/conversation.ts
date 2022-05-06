import { IsReadMessage, MemberType, MessageType, NotificationType } from '$enums/common';
import { PagingParams } from '.';

export interface CreateGroupParams {
  conversationId: number;
  locationName: string;
  lat: number;
  lng: number;
  timeStart: string;
  timeEnd: string;
  memberMax: number;
  description: string;
  groupName: string;
}

export interface CreateConversationParams {
  memberId: number;
  memberType: MemberType;
  isAdmin: 0 | 1 | number;
  conversationId?: number;
}

export interface IUpdateReadMessageState {
  memberId: number;
  conversationId: number;
  memberType: MemberType;
  isRead?: IsReadMessage;
  lastReadTime: number;
}

export interface IMembersOnlineInConversation {
  memberId: number;
  memberType: MemberType;
  conversationId?: number;
}

export interface IUpdateConversationParams {
  lastMessage: string;
  lastSentMemberId: number;
  lastTimeSent: string;
}

export interface IListMessages {
  memberId: number;
  conversationId?: number;
  take: number;
  takeAfter?: number;
  takeBefore?: number;
  leaveAt?: number; // Time member leave group.
  removeAt?: number; // Time member leave group.
}

export interface ISaveMessage {
  body: string;
  image: string;
  memberId: number;
  metadata: string;
  messageType: MessageType;
  conversationId: number;
  createdAt: number;
}

export interface INotificationObj {
  type: NotificationType;
  memberId: number; // owner
  targetId: number;
  name: string;
  avatar: string;
  avatar50x50?: string;
  avatar400x400?: string;
  content: string;
  objectId: number; // coversationId
  objectName: string;
}

export interface IListInviteToGroup {
  take: number;
  takeAfter: string;
}

export interface IUpdateGroupInformation {
  locationName: string;
  timeStart: string;
  timeEnd: string;
  groupName: string;
  memberMax: number;
  description: string;
}

export interface IKickMemberOutGroupParams {
  groupId: number;
  targetId: number;
  memberId: number;
}
