import FavoritePlace from '$entities/FavoritePlace';
import JobFollow from '$entities/JobFollow';
import Member from '$entities/Member';
import MemberGeolocation from '$entities/MemberGeolocation';
import {
  ConversationMemberStatus,
  ConversationRequestType,
  ErrorCode,
  FavoriteType,
  MemberStatus,
  MemberType,
  NotificationStatus,
  ShareLocationStatus,
  StartProcess,
} from '$enums/common';
import { assignThumbURL, handleOutputPaging } from '$helpers/utils';
import {
  UpdateMemberProfile,
  UpdateGeolocationParams,
  IFavoritePlace,
  ISettingShareLocation,
} from '$interfaces/member';
import { compact, uniq } from 'lodash';
import { getConnection, getRepository, In, Not, Repository } from 'typeorm';
import { Socket } from 'dgram';
import MemberBlock from '$entities/MemberBlock';
import Favorite from '$entities/Favorite';

export async function updateProfile(memberId: number, { jobsFollow, favoritePlace, ...params }: UpdateMemberProfile) {
  await getConnection().transaction(async (transaction) => {
    const memberRepository = transaction.getRepository(Member);
    const jobsFollowRepository = transaction.getRepository(JobFollow);
    const favoritePlaceRepository = transaction.getRepository(FavoritePlace);

    await Promise.all([
      updateJobFollow(memberId, jobsFollow, jobsFollowRepository, memberRepository),
      updateFavoritePlace(favoritePlaceRepository, memberId, favoritePlace),
      memberRepository.update(memberId, params),
    ]);
  });
}

export async function getMemberProfile(memberId: number) {
  const memberRepository = getRepository(Member);
  const queryBuilder = memberRepository
    .createQueryBuilder('m')
    .leftJoinAndMapMany('m.jobsFollow', JobFollow, 'jf', 'm.id = jf.memberId')
    .leftJoinAndMapMany('m.favoritePlace', FavoritePlace, 'fp', 'fp.memberId = m.id')
    .select([
      'm.id',
      'm.name',
      'm.phone',
      'm.email',
      'm.jobId',
      'm.kenId',
      'm.address',
      'm.avatar',
      'm.gender',
      'm.introduce',
      'm.position',
      'm.birthday',
      'm.shareLocationStatus',
      'm.shareLocationExpire',
      'jf.jobId',
      'fp.id',
      'fp.namePlace',
      'fp.lat',
      'fp.lng',
      'fp.description',
    ])
    .where('m.id = :memberId', { memberId });
  const result = await queryBuilder.getOne();
  if (result) result['jobsFollow'] = result['jobsFollow'].map((item: { jobId: number }) => item.jobId);
  assignThumbURL(result, 'avatar');
  return result;
}

export async function updateMemberGeolocation(memberId: number, params: UpdateGeolocationParams) {
  const memberGeolocationRepository = getRepository(MemberGeolocation);
  params.updateAt = new Date().getTime();
  await memberGeolocationRepository.update({ memberId }, params);
}

export async function getProcessUpdateInformation(memberId: number) {
  const member = await getRepository(Member).findOne({
    where: { id: memberId },
    select: ['id', 'name', 'introduce', 'gender', 'subscriptionExpireAt'],
  });

  const jobFollows = await getRepository(JobFollow).count({ where: { memberId }, select: ['jobId'] });
  const subscriptionExpireAt = member.subscriptionExpireAt;
  delete member.subscriptionExpireAt;

  if (Object.values(member).some((item) => !!item === false)) return StartProcess.FIRST_STEP;
  if (!jobFollows) return StartProcess.SECOND_STEP;

  const expireUnix = new Date(subscriptionExpireAt).getTime();
  const current = new Date().getTime();
  if (expireUnix < current) return StartProcess.BUY_SUBSCRIPTION_STEP;

  return StartProcess.COMPLETED;
}

export async function updateJobFollow(
  memberId: number,
  jobIds: number[],
  repository?: Repository<JobFollow>,
  memberRepository?: Repository<Member>
) {
  if (repository) {
    if (jobIds) {
      await repository.delete({ memberId, jobId: Not(In([...jobIds, 0])) });
      const data = jobIds.map((item) => ({ memberId, jobId: item }));
      await repository.save(data);
      const member = await memberRepository.findOne(memberId);
      if (member.status === MemberStatus.DEFAULT) {
        await memberRepository.update(memberId, { status: MemberStatus.ACTIVE });
      }
    }
  } else {
    return await getConnection().transaction(async (transaction) => {
      if (jobIds) {
        repository = transaction.getRepository(JobFollow);
        memberRepository = transaction.getRepository(Member);

        await repository.delete({ memberId, jobId: Not(In([...jobIds, 0])) });
        const data = jobIds.map((item) => ({ memberId, jobId: item }));
        await repository.save(data);

        const member = await memberRepository.findOne(memberId);
        if (member.status === MemberStatus.DEFAULT) {
          await memberRepository.update(memberId, { status: MemberStatus.ACTIVE });
        }
      }
    });
  }
}

export async function updateFavoritePlace(
  repository: Repository<FavoritePlace>,
  memberId: number,
  favoritePlace: IFavoritePlace[]
) {
  if (!favoritePlace) return;
  const placeIds = compact(favoritePlace.map((item) => item.id));
  const newPlace = favoritePlace.filter((item) => !item.id);
  const oldPlace = favoritePlace.filter((item) => item.id);

  await repository.delete({ memberId, id: Not(In([...placeIds, 0])) });

  if (newPlace.length) {
    newPlace.forEach((item) => {
      item.memberId = memberId;
    });
    await repository.save(newPlace);
  }

  if (oldPlace.length) {
    const run = oldPlace.map((item) => {
      return repository.update({ id: item.id, memberId }, item);
    });
    await Promise.all(run);
  }
}

export async function getFollowJobs(memberId: number) {
  const jobFollows = await getRepository(JobFollow).find({ where: { memberId }, select: ['jobId'] });
  return jobFollows.map((item) => item.jobId);
}

export async function getProfileOfMember(memberId: number, targetId: number, conversationId?: number) {
  const memberRepository = getRepository(Member);
  const favoriteRepository = getRepository(Favorite);
  const memberBlockRepository = getRepository(MemberBlock);
  const jobFollowRepository = getRepository(JobFollow);

  const isExist = await memberBlockRepository.findOne({
    where: [
      { memberId, targetId },
      { memberId: targetId, targetId: memberId },
    ],
  });
  if (isExist) throw ErrorCode.You_Can_Not_View_This_Site;

  const queryBuilder = memberRepository
    .createQueryBuilder('m')
    .select([
      'm.id id',
      'm.name name',
      'm.phone phone',
      'm.email email',
      'm.jobId jobId',
      'm.kenId kenId',
      'm.address address',
      'm.avatar avatar',
      'm.introduce introduce',
      'm.position position',
      'm.gender gender',
      'm.birthday birthday',
      'm.shareLocationStatus shareLocationStatus',
    ])
    .where('m.id = :memberId', { memberId: targetId });

  if (conversationId) {
    queryBuilder.addSelect(
      `(SELECT COUNT(1) FROM conversation_member WHERE conversation_id = ${Number(
        conversationId
      )} AND member_id = m.id AND status = ${ConversationMemberStatus.ACTIVE} AND member_type = ${MemberType.APP})`,
      'isJoin'
    );

    queryBuilder.addSelect(
      `(SELECT status FROM conversation_request WHERE conversation_id = ${Number(
        conversationId
      )} AND member_id = m.id AND type = ${ConversationRequestType.INVITE_MEMBER})`,
      'inviteStatus'
    );
  }
  const result = await queryBuilder.getRawOne();

  if (result) {
    result['jobsFollow'] = await jobFollowRepository.find({ where: { memberId }, select: ['jobId'] });
    result['jobsFollow'] = result['jobsFollow'].map((item: { jobId: number }) => item.jobId);

    result['isFavorite'] = await favoriteRepository.count({
      where: { memberId, targetId, type: FavoriteType.FAVORITE_MEMBER },
    });
  }
  assignThumbURL(result, 'avatar');
  return result;
}

export async function favoriteMember(memberId: number, targetId: number) {
  const favoriteRepository = getRepository(Favorite);
  const favorite = await favoriteRepository.findOne({ memberId, targetId, type: FavoriteType.FAVORITE_MEMBER });
  if (favorite) {
    await favoriteRepository.delete({ memberId, targetId, type: FavoriteType.FAVORITE_MEMBER });
    return { isFavorite: 0 };
  }
  await favoriteRepository.save({ memberId, targetId, type: FavoriteType.FAVORITE_MEMBER });
  return { isFavorite: 1 };
}

export async function updateSettingReceiveNotification(memberId: number, notificationStatus: NotificationStatus) {
  const memberRepository = getRepository(Member);
  await memberRepository.update({ id: memberId }, { notificationStatus });
  return;
}

export async function settingOnOffShareLocation(memberId: number, params: ISettingShareLocation) {
  const memberRepository = getRepository(Member);
  if (params.shareLocationStatus !== ShareLocationStatus.SHORT_TIME) {
    params.shareLocationExpire = null;
  }
  await memberRepository.update({ id: memberId }, params);
  return params;
}

export async function getListMembersFavorite(memberId: number, params) {
  const favoriteRepository = getRepository(Favorite);
  const blockIds = await getListMemberBlock(memberId);
  const queryBuilder = favoriteRepository
    .createQueryBuilder('f')
    .select([
      'm.id id',
      'm.name name',
      'm.avatar avatar',
      'm.introduce introduce',
      'm.birthday birthday',
      'mg.lat lat',
      'mg.lng lng',
      'mg.updateAt updateAt',
      'f.createdAt createdAt',
    ])
    .innerJoin(Member, 'm', 'm.id = f.targetId')
    .leftJoin(MemberGeolocation, 'mg', 'm.id = mg.memberId')
    .where('f.memberId = :memberId', { memberId })
    .andWhere('f.type = :type', { type: FavoriteType.FAVORITE_MEMBER })
    .andWhere('f.targetId NOT IN(:blockIds)', { blockIds });

  const totalItems = await queryBuilder.getCount();

  if (params.takeAfter) {
    queryBuilder.andWhere('f.createdAt < :time', { time: params.takeAfter });
  }

  const result = await queryBuilder.limit(params.take).orderBy('f.createdAt', 'DESC').getRawMany();
  assignThumbURL(result, 'avatar');
  return handleOutputPaging(result, totalItems, params);
}

export async function getListMemberBlock(memberId: number) {
  const memberBlockRepository = getRepository(MemberBlock);
  const [memberBlockTarget, targetBlockMember] = await Promise.all([
    memberBlockRepository.find({ where: { memberId }, select: ['targetId'] }),
    memberBlockRepository.find({ where: { targetId: memberId }, select: ['memberId'] }),
  ]);
  const data = memberBlockTarget.concat(targetBlockMember);
  const result = uniq(data.map((item) => item.memberId || item.targetId));
  result.push(-1);
  return result;
}

export async function blockMember(memberId: number, targetId: number) {
  const memberBlockRepository = getRepository(MemberBlock);
  await memberBlockRepository.save({ memberId, targetId });
}

export async function unblockMember(memberId: number, targetId: number) {
  const memberBlockRepository = getRepository(MemberBlock);
  await memberBlockRepository.delete({ memberId, targetId });
}
