import Ken from '$entities/Ken';
import { ErrorCode, ResourceKey } from '$enums/common';
import { handleOutputPaging } from '$helpers/utils';
import { IAddKen, IUpdateKen, IListKen, IUpdateStatusKen } from '$interfaces/ken';
import { getConnection, getRepository } from 'typeorm';

export async function getListKen(params: IListKen) {
  const kenRepo = getRepository(Ken);
  const queryBuilder = kenRepo
    .createQueryBuilder('ken')
    .select(['ken.id', 'ken.name', 'ken.status', 'ken.order', 'ken.createdBy']);

  if (params.keyword) queryBuilder.where('ken.name like :name', { name: `%${params.keyword}%` });
  if (params.status) {
    queryBuilder.andWhere('ken.status = :status', { status: params.status });
  }
  queryBuilder.take(params.take).skip(params.skip);

  const [data, total] = await queryBuilder.getManyAndCount();
  return handleOutputPaging(data, total, params);
}

export async function createKen(userId: number, params: IAddKen) {
  params.createdBy = userId;
  return await getRepository(Ken).save({ ...params });
}

export async function updateKen(kenId: number, params: IUpdateKen) {
  await getConnection().queryResultCache.remove([ResourceKey.KEN]);
  return await getRepository(Ken).update(kenId, { ...params });
}

export async function updateStatusKen(kenId: number, params: IUpdateStatusKen) {
  await getConnection().queryResultCache.remove([ResourceKey.KEN]);
  return await getRepository(Ken).update(kenId, { ...params });
}

export async function getDetailKen(kenId: number) {
  const ken = await getRepository(Ken).findOne(kenId);
  if (!ken) throw ErrorCode.Not_Found;
  return ken;
}
