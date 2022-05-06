import Member from '$entities/Member';
import Subscription from '$entities/Subscription';
import { CommonStatus, ConfigKeys, MemberStatus } from '$enums/common';
import { getRepository } from 'typeorm';
import moment from 'moment';
import Config from '$entities/Config';

export async function getListSubscriptions() {
  const subscriptionRepository = getRepository(Subscription);
  return await subscriptionRepository.find({
    where: { status: CommonStatus.ACTIVE },
    select: ['id', 'name', 'month', 'price', 'priceSale', 'status', 'createdAt', 'updateAt'],
    order: {
      order: 'ASC',
      createdAt: 'DESC',
    },
  });
}

/**
 * Get trial day in config(CMS config), default is 14days(two week).
 */
export async function buySubscription(memberId: number, subscriptionId: number) {
  const memberRepository = getRepository(Member);
  const configRepository = getRepository(Config);

  const member = await memberRepository.findOne({ id: memberId });
  const config = await configRepository.findOne({ where: { key: ConfigKeys.TRIAL_DAYS }, select: ['value'] });
  const trialDays = (config && Number(config.value)) || 14;

  /**
   * Only can buy trial in first time.
   */
  if (subscriptionId === 0) {
    if (member.subscriptionId === null)
      await memberRepository.update(
        { id: memberId },
        { subscriptionId: 0, subscriptionExpireAt: moment(new Date()).add(trialDays, 'day').toISOString() }
      );
  }

  return;
}
