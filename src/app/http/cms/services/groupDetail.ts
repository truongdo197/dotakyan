import Conversation from '$entities/Conversation';
import ConversationMember from '$entities/ConversationMember';
import GroupDetail from '$entities/GroupDetail';
import Member from '$entities/Member';
import { CommonStatus, ConversationType, ErrorCode, MeetingStatus } from '$enums/common';
import { assignThumbURL, handleOutputPaging } from '$helpers/utils';
import { IListGroupDetail, IUpdateStatusGroupDetail } from '$interfaces/groupDetail';
import { getRepository } from 'typeorm';

export async function getListGroup(params: IListGroupDetail) {
  const ConversationRepo = getRepository(Conversation);
  const queryBuilder = ConversationRepo.createQueryBuilder('c')
    .select([
      'c.id id',
      'c.conversationName conversationName',
      'g.locationName locationName',
      'g.lat latitude',
      'g.lng longitude',
      'g.timeStart timeStart',
      'g.timeEnd timeEnd',
      'g.memberMax memberMax',
      'g.status status',
      'g.description description',
    ])
    .addSelect(
      `CASE \
    WHEN g.timeStart > CURRENT_TIME THEN ${MeetingStatus.HAVE_NOT_MET}
    WHEN g.timeEnd < CURRENT_TIME THEN ${MeetingStatus.MET}
    ELSE ${MeetingStatus.MEETING}
    END`,
      'meeting'
    )
    .leftJoin(GroupDetail, 'g', 'g.conversationId = c.id')
    .where('c.conversationType = :type', { type: ConversationType.GROUP });

  if (params.keyword)
    queryBuilder.andWhere(
      `LOWER(c.conversationName like :conversationName 
      or g.locationName like :locationName)`,
      {
        conversationName: `%${params.keyword.toLowerCase()}%`,
        locationName: `%${params.keyword.toLowerCase()}%`,
      }
    );

  if (params.meetingStatus && Number(params.meetingStatus) > 0) {
    queryBuilder.andWhere(
      `CASE \
        WHEN g.timeStart > CURRENT_TIME THEN ${MeetingStatus.HAVE_NOT_MET}
        WHEN g.timeEnd < CURRENT_TIME THEN ${MeetingStatus.MET}
        ELSE ${MeetingStatus.MEETING}
        END = :meetingStatus`,
      { meetingStatus: Number(params.meetingStatus) }
    );
  } else if (Number(params.meetingStatus) === 0) {
    queryBuilder.andWhere(
      `CASE \
        WHEN g.timeStart > CURRENT_TIME THEN ${MeetingStatus.HAVE_NOT_MET}
        WHEN g.timeEnd < CURRENT_TIME THEN ${MeetingStatus.MET}
        ELSE ${MeetingStatus.MEETING}
        END IN(:meetingStatus)`,
      { meetingStatus: [MeetingStatus.HAVE_NOT_MET, MeetingStatus.MEETING] }
    );
  }

  if (params.status) {
    queryBuilder.andWhere('g.status = :status', { status: params.status });
  }

  const data = await queryBuilder.orderBy('g.timeEnd', 'DESC').take(params.take).skip(params.skip).getRawMany();
  const total = await queryBuilder.getCount();
  return handleOutputPaging(data, total, params);
}

export async function updateStatusGroup(groupId: number, params: IUpdateStatusGroupDetail) {
  return await getRepository(GroupDetail).update(groupId, params);
}

export async function getDetailGroup(id: number) {
  const ConversationRepo = getRepository(Conversation);
  const detailGroup = await ConversationRepo.createQueryBuilder('c')
    .select([
      'c.id id',
      'c.conversationName conversationName',
      'g.locationName locationName',
      'g.lat latitude',
      'g.lng longitude',
      'g.timeStart timeStart',
      'g.timeEnd timeEnd',
      'g.memberMax memberMax',
      'g.status groupStatus',
      'g.description description',
      'g.createdAt createdAt',
      'm.id adminId',
      'm.email adminEmail',
      'm.phone adminPhone',
      'm.avatar adminAvatar',
      'm.birthday adminBirthday',
      'm.name adminName',
    ])
    .addSelect(
      `CASE \
    WHEN g.timeStart > CURRENT_TIME THEN ${MeetingStatus.HAVE_NOT_MET}
    WHEN g.timeEnd < CURRENT_TIME THEN ${MeetingStatus.MET}
    ELSE ${MeetingStatus.MEETING}
    END`,
      'meeting'
    )
    .leftJoin(GroupDetail, 'g', 'g.conversationId = c.id')
    .leftJoin(ConversationMember, 'cm', 'cm.conversationId = c.id')
    .leftJoin(Member, 'm', 'cm.memberId = m.id')
    .where('c.conversationType = :type', { type: ConversationType.GROUP })
    .andWhere('c.id = :id', { id: id })
    .andWhere('cm.isAdmin = :isAdmin', { isAdmin: CommonStatus.ACTIVE })
    .getRawOne();
  if (!detailGroup) throw ErrorCode.Not_Found;
  assignThumbURL(detailGroup, 'adminAvatar');

  return detailGroup;
}
