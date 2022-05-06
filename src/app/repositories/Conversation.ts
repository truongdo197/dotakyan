import Conversation from '$entities/Conversation';
import GroupDetail from '$entities/GroupDetail';
import { CommonStatus, ConversationRequestStatus, ConversationRequestType } from '$enums/common';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(Conversation)
export class ConversationRepository extends Repository<Conversation> {
  getDetailGroup(memberId: number, conversationId: number) {
    const queryBuilder = this.createQueryBuilder('c')
      .select([
        'c.id id',
        'c.conversationName conversationName',
        'gd.locationName locationName',
        'gd.lat lat',
        'gd.lng lng',
        'gd.timeStart timeStart',
        'gd.timeEnd timeEnd',
        'gd.memberMax memberMax',
        'gd.description description',
        'gd.createdAt createdAt',
        'gd.status status',
        `(SELECT COUNT(1) FROM conversation_member WHERE conversation_id = c.id AND member_id = ${memberId}) as isJoin`,
        `(SELECT COUNT(1) FROM conversation_member WHERE conversation_id = c.id AND member_id = ${memberId} AND is_admin = ${CommonStatus.ACTIVE}) as isAdmin`,
        `(SELECT status FROM conversation_request WHERE member_id = ${memberId} AND conversation_id = ${conversationId} AND type = ${ConversationRequestType.REQUEST_JOIN}) as sentRequestStatus`,
      ])
      .innerJoin(GroupDetail, 'gd', 'c.id = gd.conversationId')
      .where('c.id = :conversationId', { conversationId });

    return queryBuilder.getRawOne();
  }
}
