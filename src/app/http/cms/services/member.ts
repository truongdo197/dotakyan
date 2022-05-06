import JobFollow from '$entities/JobFollow';
import Member from '$entities/Member';
import { MemberStatus } from '$enums/common';
import { assignThumbURL, handleOutputPaging } from '$helpers/utils';
import { IListMember } from '$interfaces/cms.member';
import { getRepository } from 'typeorm';

export async function getListMember(params: IListMember) {
  const queryBuilder = getRepository(Member)
    .createQueryBuilder('member')
    .select([
      'member.id id',
      'member.avatar avatar',
      'member.name name',
      'member.status status',
      'member.email email',
      'member.phone phone',
      'member.introduce introduce',
      'member.jobId jobId',
      'member.gender gender',
      'member.birthday birthday',
      'member.address address',
    ])
    .addSelect('TIMESTAMPDIFF(YEAR, member.birthday, CURRENT_DATE)  AS age');
  if (params.keyword && params.keyword !== '')
    queryBuilder.andWhere('(member.name like :name or member.phone like :phone)', {
      name: `%${params.keyword}%`,
      phone: `%${params.keyword}%`,
    });
  if (params.startingAge)
    queryBuilder.andWhere(`TIMESTAMPDIFF(YEAR, member.birthday, CURRENT_DATE) >= :startingage `, {
      startingage: params.startingAge,
    });
  if (params.endAge)
    queryBuilder.andWhere(`TIMESTAMPDIFF(YEAR, member.birthday, CURRENT_DATE) <= :endage`, { endage: params.endAge });
  if (params.jobId) queryBuilder.andWhere(`member.jobId = :jobId`, { jobId: params.jobId });
  if (params.gender) queryBuilder.andWhere(`member.gender = :gender`, { gender: params.gender });
  // if (params.sort) queryBuilder.orderBy(params.sort);
  const total = await queryBuilder.getCount();
  queryBuilder.offset(params.skip).limit(params.take);
  if (params.sort) queryBuilder.orderBy('member.id', params.sort);
  const data = await queryBuilder.getRawMany();
  assignThumbURL(data, 'avatar');
  return handleOutputPaging(data, total, params);
}

export async function getDetailMember(id: number) {
  const memberRepo = getRepository(Member);
  const jobFolowRepo = getRepository(JobFollow);
  const memberQueryBuilder = memberRepo
    .createQueryBuilder('member')
    .select([
      'member.id id',
      'member.avatar avatar',
      'member.name name',
      'member.status status',
      'member.email email',
      'member.phone phone',
      'member.introduce introduce',
      'member.jobId jobId',
      'member.gender gender',
      'member.birthday birthday',
      'member.address address',
    ])
    .andWhere('member.id = :id', { id: id });
  const jobFolowQueryBuilder = await jobFolowRepo.find({ select: ['jobId'], where: { memberId: id } });
  const jobFolowIds = jobFolowQueryBuilder.map((item) => {
    return item.jobId;
  });
  const member = await memberQueryBuilder.getRawOne();

  if (member) member.JobFollowIds = jobFolowIds;
  return member;
}

export async function updateStatusMember(id: number, status: number) {
  const queryBuilder = getRepository(Member).findOne(id, { select: ['status'] });
  return await getRepository(Member).update(id, { status: status });
}
