import Conversation from '$entities/Conversation';
import ConversationMember from '$entities/ConversationMember';
import GroupDetail from '$entities/GroupDetail';
import {
  CommonStatus,
  ConversationType,
  ErrorCode,
  IsReadMessage,
  ConversationMemberStatus,
  MemberType,
  ConversationRequestStatus,
  ConversationRequestType,
  NotificationType,
  MessageContent,
  LanguageKey,
  MessageType,
  NotificationContent,
  MemberStatus,
  IsReadNotification,
} from '$enums/common';
import { assignThumbURL, handleOutputPaging, lastMessage } from '$helpers/utils';
import {
  CreateConversationParams,
  CreateGroupParams,
  IKickMemberOutGroupParams,
  IListInviteToGroup,
  IListMessages,
  IMembersOnlineInConversation,
  INotificationObj,
  ISaveMessage,
  IUpdateConversationParams,
  IUpdateGroupInformation,
  IUpdateReadMessageState,
} from '$interfaces/conversation';
import {
  EntityManager,
  getConnection,
  getCustomRepository,
  getManager,
  getRepository,
  In,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import Message from '$mongo/Message';
import { ErrorHandler } from '$helpers/response';
import { pushNotification, pushNotificationMessage, pushNotificationToApp } from '$helpers/notification';
import { emitToSpecificClient, getMembersOnlineInConversation, pushSocketMessage } from '$http/modules/socket';
import { differenceBy, head, isEqual, last, take, unionWith } from 'lodash';
import Member from '$entities/Member';
import ConversationRequest from '$entities/ConversationRequest';
import Notification from '$entities/Notification';
import { ConversationMemberRepository } from '$repositories/ConversationMemberRepository';
import { LanguageKeyRepository } from '$repositories/LanguageKeyRepository';
import { ConversationRepository } from '$repositories/Conversation';
import { getMemberInformationById } from './auth';
import format from 'string-format';
import Language from '$entities/Language';

export async function createConversation(
  transaction: EntityManager,
  memberId: number,
  conversationType: ConversationType,
  members: CreateConversationParams[],
  conversationName?: string
) {
  const conversationRepository = transaction.getRepository(Conversation);
  const conversationMemberRepository = transaction.getRepository(ConversationMember);

  /**Create conversation. */
  const conversationObj = { conversationType };
  if (conversationName) Object.assign(conversationObj, { conversationName });
  if (conversationType === ConversationType.GROUP)
    Object.assign(conversationObj, { lastTimeSent: new Date().toISOString(), lastSentMemberId: memberId });
  const conversation = await conversationRepository.save(conversationObj);

  members = members.map((member) => {
    member.conversationId = conversation.id;
    return member;
  });

  /**Add members to conversation */
  await conversationMemberRepository.save(members);
  return conversation.id;
}

export async function createGroupChat(memberId: number, members: CreateConversationParams, params: CreateGroupParams) {
  const conversationType = ConversationType.GROUP;
  return await getConnection().transaction(async (transaction) => {
    const groupDetailRepository = transaction.getRepository(GroupDetail);
    params.conversationId = await createConversation(
      transaction,
      memberId,
      conversationType,
      [members],
      params.groupName
    );
    await groupDetailRepository.save(params);
    return { conversationId: params.conversationId };
  });
}

export async function getOrCreateConversation(memberId: number, targetId: number) {
  const conversationId = await getCommonConversationId(memberId, targetId);
  if (conversationId) return { conversationId };
  const conversationType = ConversationType.COMMON;
  return await getConnection().transaction(async (transaction) => {
    const conversationId = await createConversation(transaction, memberId, conversationType, [
      { isAdmin: CommonStatus.ACTIVE, memberId, memberType: MemberType.APP },
      { isAdmin: CommonStatus.INACTIVE, memberId: targetId, memberType: MemberType.APP },
    ]);
    return { conversationId };
  });
}

export async function getCommonConversationId(memberId: number, targetId: number) {
  const repoConversation = getRepository(Conversation);
  const queryBuilder = repoConversation
    .createQueryBuilder('conversation')
    .select('conversation.id', 'id')
    .innerJoin(ConversationMember, 'member', 'conversation.id = member.conversationId')
    .where(
      `(
          (member.memberId = :memberId AND member.memberType = :app) OR
          (member.memberId = :targetId AND member.memberType = :app)
        )`,
      { memberId, targetId, app: MemberType.APP }
    )
    .andWhere('conversation.conversationType = :conversationType', { conversationType: ConversationType.COMMON })
    .having('COUNT(conversation.id) > 1')
    .limit(1)
    .groupBy('conversation.id');
  const conversation = await queryBuilder.getRawOne();
  return conversation && conversation.id;
}

export async function isMemberOfConversation(
  conversationMemberRepository: Repository<ConversationMember>,
  conversationId: number,
  memberId: number,
  memberType: MemberType
) {
  conversationMemberRepository = conversationMemberRepository
    ? conversationMemberRepository
    : getRepository(ConversationMember);
  const count = await conversationMemberRepository.count({
    conversationId,
    memberId,
    memberType,
    status: CommonStatus.ACTIVE,
  });
  return !!count;
}

interface IListConversation {
  takeAfter?: string;
  keyword?: string;
  take?: number;
  conversationId?: number;
}

export async function getListConversations(memberId: number, params: IListConversation) {
  const manager = getManager();
  let conditions = '';
  let parameters = [];
  params.take = Number(params.take) || 10;

  if (params.conversationId) {
    parameters.push(params.conversationId);
    conditions += ' AND temp.id = ? ';
  }

  if (params.takeAfter) {
    parameters.push(params.takeAfter);
    conditions += ' AND temp.lastTimeSent < ? ';
  }

  if (params.keyword) {
    parameters.push(`%${params.keyword}%`.toLowerCase());
    conditions += ' AND LOWER(temp.conversationName) LIKE ? ';
  }

  const conversations = await manager.query(
    `SELECT temp.*, m.name as lastSentName FROM ((
      SELECT
        c.id,
        IFNULL(c.conversation_name, m.name) as conversationName,
        m.avatar as conversationAvatar,
        IF(cm2.status = ${CommonStatus.INACTIVE}, '${MessageContent.NOT_IN_CONVERSATION}', c.last_message) lastMessage,
        IF(cm2.status = ${CommonStatus.INACTIVE}, cm2.leave_at, c.last_time_sent) as lastTimeSent,
        IFNULL(cm2.last_read_time, 0) as lastReadTime,
        c.conversation_type as conversationType,
        c.last_sent_member_id as lastSentMemberId,
        IF(cm2.status = ${CommonStatus.INACTIVE}, ${IsReadMessage.READ}, cm2.is_read) as isRead,
        c.created_at as createdAt,
        cm.member_id as targetId,
        m.position as position,
        cm2.remove_at
      FROM
        conversation c
        # cm is target
      INNER JOIN conversation_member cm ON
        cm.conversation_id = c.id
        AND c.conversation_type = ${ConversationType.COMMON}
        AND cm.member_id <> ${memberId}
        #cm2 is me
      INNER JOIN conversation_member cm2 ON
        cm2.conversation_id = c.id
        AND c.conversation_type = ${ConversationType.COMMON}
        AND cm2.member_id = ${memberId}
        # Target member
      INNER JOIN member m ON
        m.id = cm.member_id
      WHERE 1=1 ${
        Number(params.conversationId)
          ? ` AND c.id = ${Number(params.conversationId)} `
          : ' AND c.last_sent_member_id IS NOT NULL '
      } AND (cm2.remove_at IS NULL OR cm2.remove_at < c.last_time_sent))
      UNION ALL
      (
      SELECT
        c.id as id,
        c.conversation_name as conversationName,
        null as conversationAvatar,
        IF(cm.status = ${CommonStatus.INACTIVE}, "${MessageContent.NOT_IN_CONVERSATION}", c.last_message) lastMessage,
        IF(cm.status = ${CommonStatus.INACTIVE}, cm.leave_at, c.last_time_sent) as lastTimeSent,
        IFNULL(cm.last_read_time, ${CommonStatus.INACTIVE}) as lastReadTime,
        c.conversation_type as conversationType,
        c.last_sent_member_id as lastSentMemberId,
        cm.is_read isRead,
        c.created_at as createdAt,
        null as targetId,
        null as position,
        cm.remove_at
      FROM
        conversation c
      INNER JOIN conversation_member cm ON
        c.conversation_type = ${ConversationType.GROUP} AND cm.member_id = ${memberId}
        AND c.id = cm.conversation_id

      #INNER JOIN conversation_member cm2 ON
      #  c.conversation_type = ${ConversationType.GROUP} AND cm2.is_admin = ${CommonStatus.ACTIVE}
      #  AND c.id = cm2.conversation_id
      #INNER JOIN member m ON m.id = cm2.member_id

      WHERE cm.status <> ${ConversationMemberStatus.LEAVE_GROUP} ${
      Number(params.conversationId) ? ` AND c.id = ${Number(params.conversationId)} ` : ''
    } AND (cm.remove_at IS NULL OR cm.remove_at < c.last_time_sent))) as temp
      LEFT JOIN member m ON m.id = temp.lastSentMemberId
      WHERE 1=1 ${conditions}
      ORDER BY temp.lastTimeSent DESC LIMIT ${params.take}`,
    parameters
  );
  await assignUnreadMessages(memberId, conversations);
  await getMemberConversationImages(conversations);
  const result = params.conversationId ? head(conversations) : conversations;
  return handleOutputPaging(result, null, params);
}

export async function assignUnreadMessages(memberId: number, conversations: Array<any>) {
  for (let item of conversations) {
    item.totalUnread = await Message.countDocuments({
      conversationId: { $eq: item.id },
      memberId: { $ne: memberId },
      createdAt: { $gt: item.lastReadTime },
    }).lean();
  }
}

/**
 * Get conversationId & total message unread of member in conversation.
 */
export async function getListConversationsUnread(memberId: number) {
  const conversationRepository = getRepository(Conversation);
  const queryBuilder = conversationRepository
    .createQueryBuilder('c')
    .select(['c.id id', 'cm.isRead isRead'])
    .innerJoin(ConversationMember, 'cm', 'c.id = cm.conversationId AND cm.memberId = :memberId', { memberId })
    .where('cm.status = :status', { status: ConversationMemberStatus.ACTIVE })
    .andWhere('cm.isRead = :isRead', { isRead: IsReadMessage.UNREAD })
    .andWhere('c.lastSentMemberId IS NOT NULL');
  const result = await queryBuilder.getRawMany();

  // await assignUnreadMessages(memberId, result);
  return result;
}

/**
 * Update read time, isRead state of members;
 * @param conversationMemberRepository
 * @param members List members of conversation(active member)
 * @param membersOnlineInConversation list member is on line in conversation(focus tab in conversation).
 */
export async function updateReadMessageState(
  conversationMemberRepository: Repository<ConversationMember>,
  members: IUpdateReadMessageState[],
  membersOnlineInConversation: IMembersOnlineInConversation[],
  lastReadTime: number
) {
  members = members.map((item) => {
    item.isRead = Number(membersOnlineInConversation.some((el) => el.memberId === item.memberId));
    item.lastReadTime = item.isRead ? lastReadTime : item.lastReadTime;
    return item;
  });
  const updateReadState = members.map(({ isRead, lastReadTime, ...item }) => {
    return conversationMemberRepository.update(item, { lastReadTime, isRead });
  });
  await Promise.all(updateReadState);
  return members;
}

export async function updateConversationState(
  conversationRepository: Repository<Conversation>,
  conversationId: number,
  params: IUpdateConversationParams
) {
  await conversationRepository.update({ id: conversationId }, params);
}

export async function getActiveMembersOfConversation(
  conversationMemberRepository: Repository<ConversationMember>,
  conversationId: number
) {
  const members = await conversationMemberRepository.find({
    select: ['memberId', 'memberType', 'conversationId', 'lastReadTime'],
    where: {
      conversationId,
      status: ConversationMemberStatus.ACTIVE,
    },
  });
  return members;
}

interface ISendMessageParams {
  conversationId: number;
  memberId: number;
  memberType: MemberType;
  body: string;
  messageType: MessageType;
  image: string;
  metadata: string;
  lastMessage?: string;
  name: string;
}
/**
 * 1. Update conversation state.
 * 2. Update conversation member state.
 * @param params
 */
export async function sendMessage(params: ISendMessageParams) {
  return await getConnection().transaction(async (transaction) => {
    const conversationRepository = transaction.getRepository(Conversation);
    const conversationMemberRepository = transaction.getRepository(ConversationMember);
    const { conversationId, memberId, memberType, body, messageType, image, metadata, lastMessage, name } = params;

    const current = new Date();
    const currentISO = current.toISOString();
    const currentUnix = current.getTime();

    const isMember = await isMemberOfConversation(conversationMemberRepository, conversationId, memberId, memberType);
    if (!isMember) throw new ErrorHandler(ErrorCode.Access_Denied, 403, 'Not is member of this conversation');

    const members = await getActiveMembersOfConversation(conversationMemberRepository, conversationId);
    await updateConversationState(conversationRepository, conversationId, {
      lastMessage: lastMessage,
      lastSentMemberId: memberId,
      lastTimeSent: currentISO,
    });

    let membersOnline = getMembersOnlineInConversation(conversationId);
    // make sure sender exist in array.
    membersOnline = unionWith(membersOnline, [{ memberId, memberType: MemberType.APP, conversationId }], isEqual);

    const membersUpdated = await updateReadMessageState(
      conversationMemberRepository,
      members,
      membersOnline,
      currentUnix
    );

    const messageObj = {
      body,
      image,
      metadata,
      memberId,
      messageType,
      conversationId,
      createdAt: currentUnix,
    };

    const message = await saveMessage(messageObj);
    messageObj['_id'] = message._id;
    messageObj['status'] = message.status;

    // TODO: Push notification.
    // pushNotification(memberId, body, {})
    pushSocketMessage(
      membersUpdated,
      {
        id: conversationId,
        lastMessage: lastMessage || body,
        lastTimeSent: currentISO,
        lastReadTime: currentUnix,
        lastSentMemberId: memberId,
        lastSentName: name,
      },
      messageObj
    );
  });
}

export async function saveMessage(params: ISaveMessage) {
  const saveMessage = new Message(params);
  const result = await saveMessage.save();
  return result.toObject();
}

export async function getMessageOfConversation(conversationId: number, { memberId, ...params }: IListMessages) {
  const conversationMemberRepository = getRepository(ConversationMember);
  const isMember = await conversationMemberRepository.count({
    conversationId,
    memberId,
    memberType: MemberType.APP,
    status: In([ConversationMemberStatus.ACTIVE, ConversationMemberStatus.KICKED]),
  });

  if (!isMember) throw ErrorCode.You_Are_Not_Member_Of_Conversation;

  const member = await conversationMemberRepository.findOne({
    where: { memberId, conversationId },
    select: ['leaveAt', 'memberId', 'memberType', 'conversationId', 'removeAt'],
  });

  if (member.leaveAt && member.status === ConversationMemberStatus.KICKED)
    params.leaveAt = new Date(member.leaveAt).getTime();
  if (member.removeAt) params.removeAt = new Date(member.removeAt).getTime();

  const query = Message.find();
  query.where('conversationId').equals(conversationId).where('status').equals(CommonStatus.ACTIVE);

  if (params.leaveAt) {
    params.takeAfter = params.takeAfter
      ? params.takeAfter < params.leaveAt
        ? params.takeAfter
        : params.leaveAt
      : params.leaveAt;
  }

  if (params.removeAt) {
    params.takeBefore = params.removeAt;
  }

  if (params.takeAfter) {
    query.where('createdAt').lt(params.takeAfter);
  }

  if (params.takeBefore) {
    query.where('createdAt').gt(params.takeBefore);
  }

  query
    .select('_id memberId conversationId body metadata image status messageType createdAt')
    .limit(params.take)
    .sort('-createdAt');
  const data = await query.lean().exec();
  await conversationMemberRepository.update(
    { conversationId, memberId, memberType: MemberType.APP },
    { isRead: 1, lastReadTime: new Date().getTime() }
  );
  return handleOutputPaging(data, null, params);
}

export async function getMemberReadMessage(messageId: string, conversationId: number) {
  const message = await Message.findOne({ _id: messageId }, '_id conversationId createdAt').lean().exec();

  if (!message) return;
  if (message['conversationId'] !== conversationId) return;

  const rs = await getListMemberReadMessage(conversationId, message['createdAt']);
  return rs;
}

export async function getListMemberReadMessage(conversationId: number, messageCreatedAt: number) {
  const conversationMemberRepository = getRepository(ConversationMember);
  const queryBuilder = conversationMemberRepository
    .createQueryBuilder('cm')
    .select(['m.id id', 'm.name name', 'm.avatar avatar', 'cm.lastReadTime lastReadTime'])
    .innerJoin(Member, 'm', 'cm.memberId = m.id')
    .where('cm.conversationId = :conversationId', { conversationId })
    .andWhere('cm.lastReadTime >= :lastReadTime', { lastReadTime: messageCreatedAt });
  const result = await queryBuilder.orderBy('cm.lastReadTime', 'DESC').getRawMany();
  assignThumbURL(result, 'avatar');
  return result;
}

/**
 * Check member is admin of conversation.
 */
async function isAdminOfConversation(
  conversationMemberRepository: Repository<ConversationMember>,
  memberId: number,
  conversationId: number,
  memberType: MemberType = MemberType.APP
) {
  const isAdmin = await conversationMemberRepository.findOne({
    conversationId,
    memberId,
    memberType,
    isAdmin: CommonStatus.ACTIVE,
    status: ConversationMemberStatus.ACTIVE,
  });
  return !!isAdmin;
}

/**
 * @param memberId Id member(member is admin of conversation)
 * @param targetId Id of target member invite
 */
export async function inviteJoinGroup(memberId: number, targetId: number, conversationId: number) {
  return await getConnection().transaction(async (transaction) => {
    const conversationMemberRepository = transaction.getRepository(ConversationMember);
    const conversationRepository = transaction.getRepository(Conversation);
    const conversationRequestRepository = transaction.getRepository(ConversationRequest);
    const notificationRepository = transaction.getRepository(Notification);
    const memberRepository = transaction.getRepository(Member);
    const languageKeyRepository = getCustomRepository(LanguageKeyRepository);

    const member = await memberRepository.findOne({ where: { id: memberId }, select: ['id', 'name', 'avatar'] });
    const conversation = await conversationRepository.findOne({
      where: { id: conversationId },
      select: ['id', 'conversationName', 'conversationType'],
    });

    if (conversation.conversationType !== ConversationType.GROUP)
      throw new ErrorHandler(ErrorCode.Access_Denied, 400, 'This conversation is not group');

    const isAdmin = await isAdminOfConversation(conversationMemberRepository, memberId, conversationId);
    if (!isAdmin) throw new ErrorHandler(ErrorCode.Access_Denied, 403, 'You not is admin of this conversation.');

    const targetMember = await conversationMemberRepository.findOne({
      conversationId,
      memberId: targetId,
      memberType: MemberType.APP,
    });

    if (targetMember && targetMember.status === ConversationMemberStatus.ACTIVE)
      throw new ErrorHandler(
        ErrorCode.Member_Already_In_Conversation,
        403,
        'Can not invite this member, this member already in this conversation.'
      );

    const request = await conversationRequestRepository.findOne({
      conversationId,
      memberId: targetId,
      type: ConversationRequestType.INVITE_MEMBER,
    });

    if (request) {
      // Có lời mời đang ở trạng thái reqest
      if (ConversationRequestStatus.REQUESTING === request.status) {
        throw new ErrorHandler(ErrorCode.Request_Already_Exist, 400, 'This request is already in progress');
      }

      await conversationRequestRepository.update(
        { conversationId, memberId: targetId, type: ConversationRequestType.INVITE_MEMBER },
        { status: ConversationRequestStatus.REQUESTING, createdAt: new Date().toISOString(), createdBy: memberId }
      );
    }

    if (!request) {
      await conversationRequestRepository.save({
        conversationId,
        memberId: targetId,
        status: ConversationRequestStatus.REQUESTING,
        type: ConversationRequestType.INVITE_MEMBER,
        createdBy: memberId,
      });
    }

    const notificationObj: INotificationObj = {
      type: NotificationType.INVITE_TO_GROUP,
      memberId, // sender
      targetId, // receiver member
      avatar: member.avatar,
      name: member.name,
      objectId: conversationId,
      objectName: conversation.conversationName,
      content: NotificationContent.INVITE_TO_GROUP,
    };

    assignThumbURL(notificationObj, 'avatar');
    await pushNotificationToApp(notificationRepository, notificationObj);
    emitToSpecificClient(targetId, MemberType.APP, 'notification', notificationObj);
  });
}

export async function requestJoinGroup(memberId: number, conversationId: number) {
  return await getConnection().transaction(async (transaction) => {
    const conversationMemberRepository = transaction.getRepository(ConversationMember);
    const conversationRepository = transaction.getRepository(Conversation);
    const conversationRequestRepository = transaction.getRepository(ConversationRequest);
    const notificationRepository = transaction.getRepository(Notification);
    const memberRepository = transaction.getRepository(Member);

    const conversation = await conversationRepository.findOne({
      where: { id: conversationId },
      select: ['id', 'conversationName', 'conversationType'],
    });

    const admin = await getAdminInformation(conversationMemberRepository, conversationId);
    if (memberId === admin.id) return;
    const sender = await memberRepository.findOne({ where: { id: memberId }, select: ['id', 'name', 'avatar'] });
    if (!admin) throw new ErrorHandler(ErrorCode.Unknown_Error, 400, 'Not found the admin of conversation.');

    const targetMember = await conversationMemberRepository.findOne({
      conversationId,
      memberId,
      memberType: MemberType.APP,
    });

    if (targetMember) {
      if (ConversationMemberStatus.ACTIVE === targetMember.status) {
        throw new ErrorHandler(
          ErrorCode.Member_Already_In_Conversation,
          403,
          'You can not request join in this conversation, this member already in this conversation.'
        );
      }

      if (ConversationMemberStatus.KICKED === targetMember.status) {
        throw new ErrorHandler(
          ErrorCode.You_Are_Kicked_Out_Group,
          400,
          'You can not request join in this conversation. Member kicked can not return back.'
        );
      }
    }

    const request = await conversationRequestRepository.findOne({
      conversationId,
      memberId,
      type: ConversationRequestType.REQUEST_JOIN,
    });

    if (request) {
      if (request.status === ConversationRequestStatus.REQUESTING) {
        throw ErrorCode.Request_Already_Exist;
      }

      await conversationRequestRepository.update(
        { conversationId, memberId, type: ConversationRequestType.REQUEST_JOIN },
        { status: ConversationRequestStatus.REQUESTING, createdAt: new Date().toISOString() }
      );
    }

    if (!request) {
      await conversationRequestRepository.save({
        conversationId,
        memberId,
        status: ConversationRequestStatus.REQUESTING,
        type: ConversationRequestType.REQUEST_JOIN,
        createdBy: memberId,
      });
    }

    const notificationObj: INotificationObj = {
      type: NotificationType.REQUEST_JOIN,
      memberId, // sender
      targetId: admin.id, // receiver member
      avatar: sender.avatar,
      name: sender.name,
      objectId: conversationId,
      objectName: conversation.conversationName,
      content: NotificationContent.MEMBER_REQUEST_JOIN_GROUP,
    };

    assignThumbURL(notificationObj, 'avatar');
    await pushNotificationToApp(notificationRepository, notificationObj);
    emitToSpecificClient(admin.id, MemberType.APP, 'notification', notificationObj);
  });
}

export async function getAdminInformation(
  conversationMemberRepository: Repository<ConversationMember>,
  conversationId: number
) {
  return await conversationMemberRepository
    .createQueryBuilder('cm')
    .select(['m.id id', 'm.avatar avatar', 'm.name name'])
    .innerJoin(Member, 'm', 'm.id = cm.memberId')
    .where('cm.conversationId = :conversationId', { conversationId })
    .andWhere('cm.isAdmin = :isAdmin', { isAdmin: CommonStatus.ACTIVE })
    .getRawOne();
}

export async function getListInviteToGroup(memberId: number, params: IListInviteToGroup) {
  const conversationRequestRepository = getRepository(ConversationRequest);
  const queryBuilder = conversationRequestRepository
    .createQueryBuilder('cr')
    .select([
      'cr.conversationId conversationId',
      'cr.memberId memberId',
      'm.avatar avatar',
      'm.name name',
      'c.conversationName conversationName',
      'cr.status status',
      'cr.type type',
      'cr.createdAt createdAt',
    ])
    .where('cr.memberId = :memberId', { memberId })
    .andWhere('cr.status = :status', { status: ConversationRequestStatus.REQUESTING })
    .andWhere('cr.type = :type', { type: ConversationRequestType.INVITE_MEMBER })
    .innerJoin(Member, 'm', 'cr.createdBy = m.id')
    .innerJoin(Conversation, 'c', 'c.id = cr.conversationId');

  const totalItems = await queryBuilder.getCount();

  if (params.takeAfter) {
    queryBuilder.andWhere('cr.createdAt < :takeAfter', { takeAfter: params.takeAfter });
  }

  const result = await queryBuilder.limit(params.take).orderBy('cr.createdAt', 'DESC').getRawMany();
  return handleOutputPaging(result, totalItems, params);
}

export async function getMemberConversationImages(conversations) {
  const groups = conversations.filter((item) => item.conversationType === ConversationType.GROUP);
  const groupIds = groups.map((item) => item.id);
  groupIds.push(-1);

  const conversationMembers = await getRepository(ConversationMember)
    .createQueryBuilder('cm')
    .select(['m.id id', 'm.avatar avatar', 'cm.status status', 'cm.conversationId conversationId', 'm.name name'])
    .innerJoin(Member, 'm', 'cm.memberId = m.id')
    .where('cm.conversationId IN(:groupIds)', {
      groupIds,
    })
    .getRawMany();

  const data = conversationMembers.reduce((acc, cur) => {
    acc[cur.conversationId] = acc[cur.conversationId] || [];
    acc[cur.conversationId].push(cur);
    return acc;
  }, {});

  conversations.forEach((conversation) => {
    conversation.conversationAvatar = conversation.conversationAvatar
      ? [
          {
            id: conversation.targetId,
            status: ConversationMemberStatus.ACTIVE,
            avatar: conversation.conversationAvatar,
            name: conversation.conversationName,
          },
        ]
      : data[conversation.id] || [
          {
            id: conversation.targetId,
            status: ConversationMemberStatus.ACTIVE,
            avatar: '',
            name: conversation.conversationName,
          },
        ];
    assignThumbURL(conversation.conversationAvatar, 'avatar');
  });
}

export async function getDetailGroup(memberId: number, conversationId: number) {
  const conversationRepository = getCustomRepository(ConversationRepository);
  const conversationMemberRepository = getCustomRepository(ConversationMemberRepository);

  const conversation = await conversationRepository.getDetailGroup(memberId, conversationId);
  const members = await conversationMemberRepository.getGroupMembers(conversationId);

  assignThumbURL(conversation, 'avatar');
  assignThumbURL(members, 'avatar');
  if (conversation) conversation['members'] = members;

  return conversation;
}

export async function getListRequestJoinConversation(memberId: number, conversationId: number) {
  const conversationMemberRepository = getRepository(ConversationMember);
  const conversationRequestRepository = getRepository(ConversationRequest);

  const isAdmin = await isAdminOfConversation(conversationMemberRepository, memberId, conversationId);
  if (!isAdmin) throw new ErrorHandler(ErrorCode.Permission_Denied, 400, 'You not are admin of conversation.');

  const queryBuilder = conversationRequestRepository
    .createQueryBuilder('cr')
    .select([
      'm.id id',
      'm.name name',
      'm.avatar avatar',
      'cr.conversationId conversationId',
      'm.jobId jobId',
      'm.birthday birthday',
      'cr.status status',
    ])
    .innerJoin(Member, 'm', 'm.id = cr.memberId')
    .where('cr.conversationId = :conversationId', { conversationId })
    .andWhere('cr.status = :status', { status: ConversationRequestStatus.REQUESTING })
    .andWhere('cr.type = :type', { type: ConversationRequestType.REQUEST_JOIN });

  const result = await queryBuilder.getRawMany();
  assignThumbURL(result, 'avatar');
  return result;
}

// Dong y loi moi vao group.
export async function acceptJoinGroup(memberId: number, conversationId: number) {
  const notificationRepository = getRepository(Notification);
  const conversationRequestRepository = getRepository(ConversationRequest);
  const conversationMemberRepository = getRepository(ConversationMember);
  const languageKeyRepository = getCustomRepository(LanguageKeyRepository);

  const isMember = await isMemberOfConversation(conversationMemberRepository, conversationId, memberId, MemberType.APP);
  if (isMember) return;

  const admin = await getAdminInformation(conversationMemberRepository, conversationId);

  const request = await conversationRequestRepository.findOne({
    conversationId,
    memberId: memberId,
    type: ConversationRequestType.INVITE_MEMBER,
  });

  if (!request) return;

  if ([ConversationRequestStatus.REJECT, ConversationRequestStatus.ACCEPT].includes(request.status)) {
    return;
  }

  await conversationRequestRepository.update(
    {
      conversationId,
      memberId,
      type: In([ConversationRequestType.INVITE_MEMBER, ConversationRequestType.REQUEST_JOIN]),
      status: ConversationRequestStatus.REQUESTING,
    },
    { status: ConversationRequestStatus.ACCEPT }
  );

  await Promise.all([
    notificationRepository.update(
      {
        memberId,
        objectId: conversationId,
        type: NotificationType.INVITE_TO_GROUP,
        status: CommonStatus.ACTIVE,
      },
      { showButton: CommonStatus.INACTIVE, isRead: IsReadNotification.READ }
    ),
    notificationRepository.update(
      {
        memberId: admin.id,
        objectId: conversationId,
        type: NotificationType.REQUEST_JOIN,
        status: CommonStatus.ACTIVE,
      },
      { showButton: CommonStatus.INACTIVE }
    ),
  ]);

  const CVSMember = await conversationMemberRepository.findOne({ memberId, conversationId });
  if (CVSMember) {
    await conversationMemberRepository.update(
      { memberId, conversationId, memberType: MemberType.APP },
      { status: ConversationMemberStatus.ACTIVE, leaveAt: null }
    );
  } else {
    await conversationMemberRepository.save({ memberId, conversationId, memberType: MemberType.APP });
  }

  const member = await getMemberInformationById(memberId);
  const messageContent = await languageKeyRepository.getLanguageByKey(LanguageKey.NEW_MEMBER_JOIN_CONVERSATION);

  pushMessageToConversation({
    conversationId,
    body: messageContent,
    messageType: MessageType.MEMBER_JOIN_GROUP,
    image: '',
    metadata: '',
    lastMessage: messageContent,
    memberId,
    name: member.name,
    notify: false,
  });
}

// Dong y ch member tham gia
export async function approvedMemberToGroup(memberId: number, conversationId: number, targetId: number) {
  const notificationRepository = getRepository(Notification);
  const conversationRequestRepository = getRepository(ConversationRequest);
  const conversationMemberRepository = getRepository(ConversationMember);
  const languageKeyRepository = getCustomRepository(LanguageKeyRepository);

  const isAdmin = await isAdminOfConversation(conversationMemberRepository, memberId, conversationId);
  if (!isAdmin) throw new ErrorHandler(ErrorCode.Permission_Denied, 400, 'You not are admin of conversation.');

  const request = await conversationRequestRepository.findOne({
    conversationId,
    memberId: targetId,
    type: ConversationRequestType.REQUEST_JOIN,
  });

  if (!request) return;

  if ([ConversationRequestStatus.REJECT, ConversationRequestStatus.ACCEPT].includes(request.status)) {
    return;
  }

  await Promise.all([
    conversationRequestRepository.update(
      {
        conversationId,
        memberId: targetId,
        type: In([ConversationRequestType.INVITE_MEMBER, ConversationRequestType.REQUEST_JOIN]),
        status: ConversationRequestStatus.REQUESTING,
      },
      { status: ConversationRequestStatus.ACCEPT }
    ),
    notificationRepository.update(
      {
        memberId,
        objectId: conversationId,
        type: NotificationType.REQUEST_JOIN,
        status: CommonStatus.ACTIVE,
      },
      { showButton: CommonStatus.INACTIVE, isRead: IsReadNotification.READ }
    ),
    notificationRepository.update(
      {
        memberId: targetId,
        objectId: conversationId,
        type: NotificationType.INVITE_TO_GROUP,
        status: CommonStatus.ACTIVE,
      },
      { showButton: CommonStatus.INACTIVE }
    ),
  ]);

  const CVSMember = await conversationMemberRepository.findOne({ memberId, conversationId });
  if (CVSMember) {
    await conversationMemberRepository.update(
      { memberId: targetId, conversationId, memberType: MemberType.APP },
      { status: ConversationMemberStatus.ACTIVE, leaveAt: null }
    );
  } else {
    await conversationMemberRepository.save({ memberId: targetId, conversationId, memberType: MemberType.APP });
  }

  const messageContent = await languageKeyRepository.getLanguageByKey(LanguageKey.NEW_MEMBER_JOIN_CONVERSATION);
  const member = await getMemberInformationById(targetId);

  pushMessageToConversation({
    conversationId,
    body: messageContent,
    messageType: MessageType.MEMBER_JOIN_GROUP,
    image: '',
    metadata: '',
    lastMessage: messageContent,
    memberId: targetId,
    name: member.name,
    notify: false,
  });
}

// admin reject request join of member
export async function rejectRequestJoinGroup(memberId: number, conversationId: number, targetId: number) {
  const notificationRepository = getRepository(Notification);
  const conversationRequestRepository = getRepository(ConversationRequest);
  const conversationMemberRepository = getRepository(ConversationMember);

  const isAdmin = await isAdminOfConversation(conversationMemberRepository, memberId, conversationId);
  if (!isAdmin) throw new ErrorHandler(ErrorCode.Permission_Denied, 400, 'You not are admin of conversation.');

  const request = await conversationRequestRepository.findOne({
    conversationId,
    memberId: targetId,
    type: ConversationRequestType.REQUEST_JOIN,
  });

  if (!request) return;

  if ([ConversationRequestStatus.REJECT, ConversationRequestStatus.ACCEPT].includes(request.status)) {
    return;
  }

  await Promise.all([
    conversationRequestRepository.update(
      { conversationId, memberId: targetId, type: ConversationRequestType.REQUEST_JOIN },
      { status: ConversationRequestStatus.REJECT }
    ),
    notificationRepository.update(
      {
        memberId,
        objectId: conversationId,
        type: NotificationType.REQUEST_JOIN,
        status: CommonStatus.ACTIVE,
      },
      { showButton: CommonStatus.INACTIVE, isRead: IsReadNotification.READ }
    ),
    notificationRepository.update(
      {
        memberId: targetId,
        objectId: conversationId,
        type: NotificationType.INVITE_TO_GROUP,
        status: CommonStatus.ACTIVE,
      },
      { showButton: CommonStatus.INACTIVE }
    ),
  ]);

  // TODO: Push notification reject
}

// member tu choi loi moi
export async function rejectRequestInviteGroup(memberId: number, conversationId: number) {
  const notificationRepository = getRepository(Notification);
  const conversationRequestRepository = getRepository(ConversationRequest);

  const request = await conversationRequestRepository.findOne({
    conversationId,
    memberId,
    type: ConversationRequestType.INVITE_MEMBER,
  });

  if (!request) return;

  if ([ConversationRequestStatus.REJECT, ConversationRequestStatus.ACCEPT].includes(request.status)) {
    return;
  }

  await conversationRequestRepository.update(
    { conversationId, memberId, type: ConversationRequestType.INVITE_MEMBER },
    { status: ConversationRequestStatus.REJECT }
  );

  await notificationRepository.update(
    {
      memberId,
      objectId: conversationId,
      type: NotificationType.INVITE_TO_GROUP,
      status: CommonStatus.ACTIVE,
    },
    { showButton: CommonStatus.INACTIVE, isRead: IsReadNotification.READ }
  );
}

export async function getListConversationKicked(memberId: number) {
  const conversationMembersRepository = getRepository(ConversationMember);
  const members = await conversationMembersRepository.find({
    where: { memberId, status: ConversationMemberStatus.KICKED },
  });
  const result = members.map((item) => item.conversationId);
  result.push(-1);
  return result;
}

export async function updateGroupInformation(
  memberId: number,
  groupId: number,
  { groupName, ...params }: IUpdateGroupInformation
) {
  await getConnection().transaction(async (transaction) => {
    const conversationRepository = transaction.getRepository(Conversation);
    const conversationMemberRepository = transaction.getRepository(ConversationMember);
    const groupDetailRepository = transaction.getRepository(GroupDetail);

    const isAdmin = await isAdminOfConversation(conversationMemberRepository, memberId, groupId);
    if (!isAdmin) throw new ErrorHandler(ErrorCode.Permission_Denied, 400, 'You not are admin of conversation.');

    await Promise.all([
      conversationRepository.update(
        { id: groupId, conversationType: ConversationType.GROUP },
        { conversationName: groupName }
      ),
      groupDetailRepository.update({ conversationId: groupId }, params),
    ]);
  });
}

// Member leave the group.
export async function leaveGroup(memberId: number, groupId: number) {
  await getConnection().transaction(async (transaction) => {
    const conversationRepository = transaction.getRepository(Conversation);
    const conversationMemberRepository = transaction.getRepository(ConversationMember);
    const groupDetailRepository = transaction.getRepository(GroupDetail);

    const isExist = await conversationRepository.count({ id: groupId, conversationType: ConversationType.GROUP });
    if (!isExist) throw new ErrorHandler(ErrorCode.Not_Found, 400, 'Conversation not exist');

    const member = await conversationMemberRepository.findOne({
      memberId,
      conversationId: groupId,
      status: CommonStatus.ACTIVE,
      memberType: MemberType.APP,
    });

    if (!member) throw ErrorCode.You_Are_Not_Member_Of_Conversation;

    if (member.isAdmin === CommonStatus.ACTIVE) {
      const nextLeader = await conversationMemberRepository.findOne({
        where: {
          memberId: Not(member.memberId),
          conversationId: groupId,
          status: ConversationMemberStatus.ACTIVE,
          memberType: MemberType.APP,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      // Group sau khi admin rời đi thì không còn ai nữa thì ẩn group đi.
      if (!nextLeader) {
        return await Promise.all([
          conversationMemberRepository.update(
            { conversationId: groupId, memberId, memberType: MemberType.APP },
            { status: ConversationMemberStatus.LEAVE_GROUP }
          ),
          groupDetailRepository.update({ conversationId: groupId }, { status: CommonStatus.INACTIVE }),
        ]);
      }

      // Rời đi và nhường leader lại cho người kế sau. Thông báo cho mọi người về thay đổi
      await Promise.all([
        conversationMemberRepository.update(
          { memberId, conversationId: groupId, memberType: MemberType.APP },
          { status: ConversationMemberStatus.LEAVE_GROUP }
        ),
        conversationMemberRepository.update(
          { memberId: nextLeader.memberId, conversationId: groupId, memberType: MemberType.APP },
          { isAdmin: CommonStatus.ACTIVE }
        ),
      ]);
      // TODO: Push message admin leave group, other member become leader.
    }

    // rời đi và thông báo cho mọi người về thay đổi.
    await conversationMemberRepository.update(
      { memberId, conversationId: groupId, memberType: MemberType.APP },
      { status: ConversationMemberStatus.LEAVE_GROUP }
    );

    // TODO: push message member leave group
    const memberInfo = await getMemberInformationById(memberId);

    const body = format(NotificationContent.MEMBER_LEAVE_GROUP, { nickname: memberInfo.name });
    pushMessageToConversation({
      conversationId: groupId,
      body,
      messageType: MessageType.MEMBER_LEAVE_GROUP,
      image: '',
      metadata: '',
      lastMessage: body,
      memberId,
      name: memberInfo.name,
      notify: false,
    });
  });
}

export async function kickMemberOutGroup({ memberId, groupId, targetId }: IKickMemberOutGroupParams) {
  return await getConnection().transaction(async (transaction) => {
    // const memberRepository = transaction.getRepository(Member);
    const conversationMemberRepository = transaction.getRepository(ConversationMember);

    const isAdmin = await isAdminOfConversation(conversationMemberRepository, memberId, groupId);
    if (!isAdmin) throw new ErrorHandler(ErrorCode.Permission_Denied, 400, 'You are not a admin of group.');
    if (memberId === targetId) return;

    const memberExist = await conversationMemberRepository.count({
      where: {
        conversationId: groupId,
        memberId: targetId,
        status: ConversationMemberStatus.ACTIVE,
        memberType: MemberType.APP,
      },
    });

    if (!memberExist)
      throw new ErrorHandler(ErrorCode.Not_Found, 400, `Not found memberId = ${targetId} in this conversation.`);

    // Get member for notice
    const members = await getActiveMembersOfConversation(conversationMemberRepository, groupId);

    await conversationMemberRepository.update(
      {
        memberId: targetId,
        memberType: MemberType.APP,
        conversationId: groupId,
      },
      { status: ConversationMemberStatus.KICKED, leaveAt: new Date().toISOString() }
    );
    const member = await getMemberInformationById(targetId);

    const body = format(NotificationContent.MEMBER_LEAVE_GROUP, { nickname: member.name });
    pushMessageToConversation({
      conversationId: groupId,
      body,
      messageType: MessageType.MEMBER_LEAVE_GROUP,
      image: '',
      metadata: '',
      lastMessage: body,
      memberId: targetId,
      name: member.name,
      notify: false,
      members,
    });
  });
}

export async function pushMessageToConversation(params) {
  return await getConnection().transaction(async (transaction) => {
    const conversationRepository = transaction.getRepository(Conversation);
    const conversationMemberRepository = transaction.getRepository(ConversationMember);
    let { conversationId, memberId, body, messageType, image, metadata, lastMessage, name, notify, members } = params;

    memberId = memberId || 0;
    lastMessage = lastMessage || body;

    const current = new Date();
    const currentISO = current.toISOString();
    const currentUnix = current.getTime();

    if (!members) members = await getActiveMembersOfConversation(conversationMemberRepository, conversationId);
    await updateConversationState(conversationRepository, conversationId, {
      lastMessage: lastMessage,
      lastSentMemberId: memberId,
      lastTimeSent: currentISO,
    });

    let membersOnline = getMembersOnlineInConversation(conversationId);

    const memberNotInCVS = differenceBy(members, membersOnline, 'memberId');

    const membersUpdated = await updateReadMessageState(
      conversationMemberRepository,
      members,
      membersOnline,
      currentUnix
    );

    const messageObj = {
      body,
      image,
      metadata,
      memberId,
      messageType,
      conversationId,
      createdAt: currentUnix,
    };

    const message = await saveMessage(messageObj);
    messageObj['_id'] = message._id;
    messageObj['status'] = message.status;

    if (notify) {
      const conversation = await conversationRepository.findOne({
        where: { id: conversationId },
        select: ['id', 'conversationName', 'conversationType'],
      });

      const heading = conversation.conversationType === ConversationType.GROUP ? conversation.conversationName : name;

      let memberIds = memberNotInCVS.map((item) => item['memberId']);
      if (memberId) {
        memberIds = memberIds.filter((item) => item !== memberId);
      }

      pushNotificationMessage(memberIds, body, {
        notificationType: NotificationType.MESSAGE,
        conversationId,
        name: heading,
      });
    }

    pushSocketMessage(
      membersUpdated,
      {
        id: conversationId,
        lastMessage: lastMessage || body,
        lastTimeSent: currentISO,
        lastReadTime: currentUnix,
        lastSentMemberId: memberId,
        lastSentName: name,
      },
      messageObj
    );
  });
}

export async function removeMessageOfConversation(
  memberId: number,
  conversationId: number,
  memberType: MemberType = MemberType.APP
) {
  const conversationMemberRepository = getRepository(ConversationMember);
  await conversationMemberRepository.update(
    { conversationId, memberId, memberType },
    { removeAt: new Date().toISOString() }
  );
  return;
}
