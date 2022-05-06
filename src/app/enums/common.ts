import config from '$config';
import { getEnumValues } from '$helpers/utils';

export enum ErrorCode {
  Unknown_Error = 0,
  Invalid_Input = 1,
  Member_Blocked = 2,
  Username_Or_Password_Invalid = 3,
  Token_Not_Exist = 4,
  User_Blocked = 5,
  Token_Expired = 6,
  /**The client not send the required token in header */
  Refresh_Token_Not_Exist = 7,
  /**The client send the expire token or invalid token*/
  Refresh_Token_Invalid = 8,
  /**The client do not have permission for this action. */
  Permission_Denied = 9,
  Member_Not_Exist = 10,
  User_Not_Exist = 11,
  Not_Found = 12,
  Phone_Number_Or_Password_Invalid = 13,
  Maximum_Retry_Verification_Code = 14,
  Phone_Number_Already_exist = 15,
  Verification_Code_Invalid = 16,
  Phone_Number_Not_exist = 17,
  Subscription_Expire = 18,
  Access_Denied = 19,
  Member_Already_In_Conversation = 20,
  Request_Already_Exist = 21,
  You_Are_Kicked_Out_Group = 22,
  You_Are_Not_Member_Of_Conversation = 23,
  You_Can_Not_View_This_Site = 24,
  Username_Already_exist = 25,
  Email_Already_exist = 26,
  Verification_Code_Expire = 27,
}

export enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 0,
}

export enum MemberStatus {
  ACTIVE = 1,
  INACTIVE = 0,
  DEFAULT = 2, // Uncompleted profile
}

export enum Gender {
  MALE = 1,
  FEMALE = 2,
  OTHER = 3,
}

export enum VerificationType {
  REGISTER = 1,
  FORGOT_PASSWORD = 2,
}

export enum VerificationCodeStatus {
  ACTIVE = 1,
  USED = 0,
}

export enum MemberType {
  APP = 1,
  ADMIN = 2,
}

export enum ConversationType {
  COMMON = 1,
  GROUP = 2,
}

export enum MeetingStatus {
  MEETING = 1,
  HAVE_NOT_MET = 2,
  MET = 3,
}

export enum CommonStatus {
  ACTIVE = 1,
  INACTIVE = 0,
}
export enum StartProcess {
  FIRST_STEP = 1,
  SECOND_STEP = 2,
  BUY_SUBSCRIPTION_STEP = 3,
  COMPLETED = -1,
}

export enum Permissions {
  RESOURCE_MANAGEMENT = 1,
  PERMISSION_MANAGEMENT = 2,
  MEMBER_MANAGEMENT = 3,
  USER_MANAGEMENT = 4,
  CONFIG_MANAGEMENT = 5,
  GROUP_MANAGEMENT = 6,
}

/**
 * If subscriptionId === 0 => member is trial
 */
export interface ISubscriptionId {
  subscriptionId: 0 | number;
}

export enum ConfigKeys {
  TRIAL_DAYS = 'TRIAL_DAYS',
}

export enum ConversationMemberStatus {
  ACTIVE = 1,
  KICKED = 0,
  LEAVE_GROUP = 2,
}

export enum IsReadMessage {
  READ = 1,
  UNREAD = 0,
}

export enum IsReadNotification {
  READ = 1,
  UNREAD = 0,
}

export enum MessageType {
  TEXT = 1,
  IMAGE = 2,
  MEMBER_LEAVE_GROUP = 3,
  MEMBER_JOIN_GROUP = 4,
}

export enum ConversationRequestStatus {
  REJECT = 0,
  ACCEPT = 1,
  REQUESTING = 2,
}

export enum ConversationRequestType {
  INVITE_MEMBER = 1,
  REQUEST_JOIN = 2,
}

export enum NotificationType {
  INVITE_TO_GROUP = 1,
  REQUEST_JOIN = 2,
  MESSAGE = 3,
  REJECT_REQUEST_JOIN = 4,
}

export enum NotificationContent {
  INVITE_TO_GROUP = '{nickname} invite you to group {objectName}',
  MEMBER_LEAVE_GROUP = '{nickname} leaved group.',
  MEMBER_REQUEST_JOIN_GROUP = '{nickname} request join group {objectName}',
  ADMIN_REJECT_YOUR_REQUEST_JOIN = 'The admin reject your request join {objectName}',
}

export enum NotificationStatus {
  ON = 1,
  OFF = 0,
}

export enum ResourceType {
  JOB = 1,
}

export const ResourceKey = {
  JOB: `dotachan:${config.environment}:jobs`,
  KEN: `dotachan:${config.environment}:kens`,
  RESOURCE: `dotachan:${config.environment}:resource`,
  CONFIG: `dotachan:${config.environment}:config`,
};

export enum FavoriteType {
  FAVORITE_MEMBER = 1,
}

export enum ShareLocationStatus {
  ACTIVE = 1,
  INACTIVE = 0,
  SHORT_TIME = 2, // Active/inactive identify by share_location_expire.
}

export enum MessageContent {
  NOT_IN_CONVERSATION = 'Bạn không còn trong group này nữa...',
}

export enum LanguageKey {
  NEW_MEMBER_JOIN_CONVERSATION = 'NEW_MEMBER_JOIN_CONVERSATION',
  MEMBER_NOT_IN_CONVERSATION = 'MEMBER_NOT_IN_CONVERSATION',
}
