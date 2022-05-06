import { Request } from 'express';
import { APP, Get, Post, Put } from '$helpers/decorator';
import { ErrorHandler } from '$helpers/response';
import { validate } from '$helpers/ajv';
import * as conversation from '$app/services/conversation';
import { CommonStatus, ErrorCode, MemberType, MessageType } from '$enums/common';
import {
  createGroupChatSchema,
  sendImageMessageSchema,
  inviteMemberSchema,
  sendMessageSchema,
  requestJoinConversationSchema,
  approvedRequestSchema,
  updateGroupInformationSchema,
  leaveGroupSchema,
  acceptJoinGroupSchema,
  commonActionGroupSchema,
} from '$app/validators/chat';
import { handleInputPaging, lastMessage } from '$helpers/utils';

@APP('/chat')
export default class APPChatController {
  /**
   * From memberId & targetId, get conversationId of two member
   * If conversation not exist, create new conversation & response conversationId to client
   */
  @Get('/conversation')
  async getOrCreateConversation(req: Request) {
    const memberId = req.memberId;
    const targetId = Number(req.query.targetId);

    if (memberId === targetId)
      throw new ErrorHandler(ErrorCode.Access_Denied, 422, 'Can not create conversation with yourself');

    if (!targetId) throw new ErrorHandler(ErrorCode.Invalid_Input, 422, 'Missing targetId in query params');

    const conversationId = await conversation.getOrCreateConversation(memberId, targetId);
    return { conversationId };
  }

  /**
   * Create group chat & meeting time of group.
   */
  @Post('/create-group')
  async createGroupChat(req: Request) {
    const body = req.body;
    validate(createGroupChatSchema, body);

    if (new Date(body.timeEnd).getTime() - new Date(body.timeStart).getTime() > 1000 * 60 * 60 * 24)
      throw new ErrorHandler(ErrorCode.Invalid_Input, 422, 'Max time for meeting is 24h');

    const memberId = req.memberId;
    const members = { memberId, memberType: MemberType.APP, isAdmin: CommonStatus.ACTIVE };
    const conversationId = await conversation.createGroupChat(memberId, members, body);
    return conversationId;
  }

  @Get('/conversations')
  async getConversations(req: Request) {
    const memberId = req.memberId;
    const query = handleInputPaging(req.query);
    const result = await conversation.getListConversations(memberId, query);
    return result;
  }

  @Get('/conversations-unread')
  async getConversationsUnread(req: Request) {
    const { memberId } = req;
    const result = await conversation.getListConversationsUnread(memberId);
    return result;
  }

  @Get('/messages')
  async getListMessage(req: Request) {
    const query = handleInputPaging(req.query);
    query.memberId = req.memberId;
    const conversationId = Number(req.query.conversationId);
    const result = await conversation.getMessageOfConversation(conversationId, query);
    return result;
  }

  @Post('/send-message')
  async sendMessage(req: Request) {
    const { memberId, body } = req;
    if (!body.messageType) throw ErrorCode.Invalid_Input;
    if (body.messageType === MessageType.IMAGE) {
      validate(sendImageMessageSchema, body);
    } else {
      validate(sendMessageSchema, body);
    }
    body.memberId = memberId;
    body.memberType = MemberType.APP;
    body.lastMessage = lastMessage(body.body, body.lastMessage);
    body.name = req.name;
    await conversation.sendMessage(body);
    return;
  }

  @Get('/conversation/:conversationId')
  async getConversationInformation(req: Request) {
    const { memberId } = req;
    const conversationId = Number(req.params.conversationId);
    const result = await conversation.getListConversations(memberId, { conversationId });
    return result;
  }

  @Get('/members-read-message')
  async getMemberReadMessage(req: Request) {
    const messageId = String(req.query.messageId);
    const conversationId = Number(req.query.conversationId);
    if (!messageId || !conversationId)
      throw new ErrorHandler(ErrorCode.Invalid_Input, 422, 'MessageId or conversationId invalid');
    const result = await conversation.getMemberReadMessage(messageId, conversationId);
    return result;
  }

  @Post('/invite-to-conversation')
  async inviteMemberToConversation(req: Request) {
    const memberId = req.memberId;
    const { conversationId, targetId } = req.body;

    if (memberId === targetId) return;
    validate(inviteMemberSchema, { conversationId, targetId });

    await conversation.inviteJoinGroup(memberId, targetId, conversationId);
    return;
  }

  @Post('/request-join-conversation')
  async requestJoinConversation(req: Request) {
    const memberId = req.memberId;
    const { conversationId } = req.body;

    validate(requestJoinConversationSchema, { conversationId });

    await conversation.requestJoinGroup(memberId, conversationId);
    return;
  }

  @Get('/lits-request-join/:groupId')
  async listMemberRequestJoinGroup(req: Request) {
    const groupId = Number(req.params.groupId);
    const memberId = req.memberId;
    if (!groupId) throw new ErrorHandler(ErrorCode.Invalid_Input, 422, 'Missing groupId in params URL');
    return await conversation.getListRequestJoinConversation(memberId, groupId);
  }

  @Get('/list-invite-request')
  async getListInviteGroup(req: Request) {
    const memberId = req.memberId;
    const query = handleInputPaging(req.body);
    return await conversation.getListInviteToGroup(memberId, query);
  }

  @Get('/detail-group/:groupId')
  async getDetailGroup(req: Request) {
    const groupId = Number(req.params.groupId);
    const memberId = req.memberId;
    if (!groupId) throw new ErrorHandler(ErrorCode.Invalid_Input, 422, 'Missing groupId in params URL');
    return await conversation.getDetailGroup(memberId, groupId);
  }

  @Post('/approved-member')
  async approvedMemberToGroup(req: Request) {
    const {
      memberId,
      body: { targetId, conversationId },
    } = req;
    validate(approvedRequestSchema, { targetId, conversationId });
    return await conversation.approvedMemberToGroup(memberId, conversationId, targetId);
  }

  @Post('/accept-join-group')
  async acceptJoinGroup(req: Request) {
    const {
      memberId,
      body: { conversationId },
    } = req;
    validate(acceptJoinGroupSchema, { conversationId });
    return await conversation.acceptJoinGroup(memberId, conversationId);
  }

  @Post('/reject-member')
  async rejectMemberToGroup(req: Request) {
    const {
      memberId,
      body: { targetId, conversationId },
    } = req;
    validate(approvedRequestSchema, { targetId, conversationId });
    return await conversation.rejectRequestJoinGroup(memberId, conversationId, targetId);
  }

  @Put('/edit-group/:groupId')
  async editGroup(req: Request) {
    const groupId = Number(req.params.groupId);
    const memberId = req.memberId;
    const body = req.body;

    if (!groupId) throw ErrorCode.Invalid_Input;
    validate(updateGroupInformationSchema, body);
    await conversation.updateGroupInformation(memberId, groupId, body);
    return;
  }

  @Post('/leave-group')
  async leaveGroup(req: Request) {
    const memberId = req.memberId;
    const { groupId } = req.body;
    if (!groupId) throw ErrorCode.Invalid_Input;
    validate(leaveGroupSchema, { groupId });
    await conversation.leaveGroup(memberId, groupId);
    return;
  }

  @Post('/kick-member')
  async kickMemberOutGroup(req: Request) {
    const memberId = req.memberId;
    const { conversationId, targetId } = req.body;
    validate(commonActionGroupSchema, { conversationId, targetId });
    await conversation.kickMemberOutGroup({ groupId: conversationId, targetId, memberId });
    return;
  }

  @Post('/reject-join-group')
  async rejectRequestInvite(req: Request) {
    const memberId = req.memberId;
    const { conversationId } = req.body;
    validate(commonActionGroupSchema, { conversationId });
    await conversation.rejectRequestInviteGroup(memberId, conversationId);
    return;
  }

  @Post('/remove-message')
  async removeMessage(req: Request) {
    const memberId = req.memberId;
    const { conversationId } = req.body;
    validate(commonActionGroupSchema, { conversationId });
    await conversation.removeMessageOfConversation(memberId, conversationId);
    return;
  }
}
