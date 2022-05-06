import { Client } from 'onesignal-node';
import config from '$config';
import _, { chunk } from 'lodash';
import format from 'string-format';
import { CreateNotificationBody } from 'onesignal-node/lib/types';
import { INotificationObj } from '$interfaces/conversation';
import { getRepository, Repository } from 'typeorm';
import Notification from '$entities/Notification';
import Member from '$entities/Member';
import { assignThumbURL } from './utils';
const client = new Client(config.oneSignal.appId, config.oneSignal.restKey);

interface SenderInfo {
  memberId: number;
  conversationId: number;
  avatar: string;
  name: string;
  notification_type: number;
}

export async function pushNotification(memberId: number, content: string, data: any) {
  const notification: CreateNotificationBody = {
    headings: {
      en: data.heading || '',
      ja: data.heading || '',
      vi: data.heading || '',
    },
    contents: {
      en: content,
      ja: content,
      vi: content,
    },
    data,
    android_group: `dotachan_notification`,
    adm_group: `dotachan_notification`,
    thread_id: `dotachan_notification`,
    filters: [
      {
        field: 'tag',
        key: 'memberId',
        relation: '=',
        value: memberId,
      },
    ],
  };
  return await client.createNotification(notification);
}

export async function pushNotificationMessage(memberIds: number[], content: string, data: any) {
  const arrayMemberIds = chunk(memberIds, 100);
  for (let ids of arrayMemberIds) {
    for (let memberId of ids) {
      const filters = [];
      if (filters.length > 0) {
        filters.push({
          operator: 'OR',
        });
        filters.push({
          field: 'tag',
          key: 'memberId',
          relation: '=',
          value: memberId,
        });
      } else {
        filters.push({
          field: 'tag',
          key: 'memberId',
          relation: '=',
          value: memberId,
        });
      }
      const notification: CreateNotificationBody = {
        headings: {
          en: data.name,
          ja: data.name,
          vi: data.name,
        },
        contents: {
          en: content,
          ja: content,
          vi: content,
        },
        data,
        android_group: `conversation_${data.conversationId}`,
        adm_group: `conversation_${data.conversationId}`,
        thread_id: `conversation_${data.conversationId}`,
        filters,
      };
      await client.createNotification(notification);
    }
  }
}

export async function pushNotificationToApp(
  notificationRepository: Repository<Notification>,
  params: INotificationObj
) {
  const notificationContent = params.content;

  const isOn = await isOnNotification(params.targetId);
  if (isOn) {
    params.content = format(notificationContent, {
      nickname: params.name,
      objectName: params.objectName,
    });

    pushNotification(params.targetId, params.content, params);
  }

  const content = format(notificationContent, {
    nickname: `<b>${params.name}</b>`,
    objectName: `<b>${params.objectName}</b>`,
  });

  await notificationRepository.save({
    type: params.type,
    avatar: params.avatar,
    createdBy: params.memberId,
    memberId: params.targetId,
    objectId: params.objectId,
    content,
  });

  assignThumbURL(params, 'avatar');
}

export async function isOnNotification(memberId: number) {
  const memberRepository = getRepository(Member);
  const member = await memberRepository.findOne({ id: memberId });
  return member.shareLocationStatus;
}
