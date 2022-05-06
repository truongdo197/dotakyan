import Member from '$entities/Member';
import Notification from '$entities/Notification';
import { CommonStatus, ErrorCode, IsReadNotification } from '$enums/common';
import { assignThumbURL, handleOutputPaging } from '$helpers/utils';
import { getRepository } from 'typeorm';

interface IListNotification {
  takeAfter: string;
  take: number;
}
export async function getListNotifications(memberId: number, params: IListNotification) {
  const notificationRepository = getRepository(Notification);
  const queryBuilder = notificationRepository
    .createQueryBuilder('n')
    .select([
      'n.id id',
      'n.type type',
      'n.avatar avatar',
      'n.createdBy createdBy',
      'n.memberId memberId',
      'n.objectId objectId',
      'n.isRead isRead',
      'n.showButton showButton',
      'n.content content',
      'n.updateAt updateAt',
      'n.createdAt createdAt',
      'n.status status',
    ])
    .innerJoin('Member', 'm', 'n.createdBy = m.id')
    .where('n.memberId = :memberId', { memberId })
    .andWhere('n.status = :status', { status: CommonStatus.ACTIVE });

  const totalItems = await queryBuilder.getCount();
  if (params.takeAfter) {
    queryBuilder.andWhere('n.createdAt < :takeAfter', { takeAfter: params.takeAfter });
  }

  const data = await queryBuilder
    .limit(params.take)
    .orderBy('n.createdAt', 'DESC')
    .addOrderBy('n.id', 'DESC')
    .getRawMany();
  assignThumbURL(data, 'avatar');
  return handleOutputPaging(data, totalItems, params);
}

export async function readNotification({ memberId, notificationId }: { memberId: number; notificationId: number }) {
  const notificationRepository = getRepository(Notification);
  const notification = await notificationRepository.findOne({
    where: { id: notificationId },
    select: ['id', 'memberId', 'isRead'],
  });
  if (!notification) throw ErrorCode.Not_Found;
  if (notification.memberId !== memberId) throw ErrorCode.Permission_Denied;
  if (notification.isRead === IsReadNotification.UNREAD)
    await notificationRepository.update(notificationId, { isRead: IsReadNotification.READ });
  return;
}
