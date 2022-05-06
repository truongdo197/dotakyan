import ConversationMember from '$entities/ConversationMember';
import Member from '$entities/Member';
import { CommonStatus } from '$enums/common';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(ConversationMember)
export class ConversationMemberRepository extends Repository<ConversationMember> {
  /**
   * Get conversation members of cgroup
   * @param conversationId
   * @param hasAdmin
   */
  getGroupMembers(conversationId: number, hasAdmin: CommonStatus = CommonStatus.ACTIVE) {
    const queryBuilder = this.createQueryBuilder('cm')
      .select([
        'm.id id',
        'm.avatar avatar',
        'm.birthday birthday',
        'm.name name',
        'm.jobId jobId',
        'm.position position',
        'cm.isAdmin isAdmin',
        'cm.status status',
      ])
      .innerJoin(Member, 'm', 'm.id = cm.memberId')
      .where('cm.conversationId = :conversationId', { conversationId });

    if (!hasAdmin) {
      queryBuilder.andWhere('cm.isAdmin = :isAdmin', { isAdmin: CommonStatus.INACTIVE });
    }

    return queryBuilder.orderBy('cm.createdAt', 'DESC').getRawMany();
  }
}
