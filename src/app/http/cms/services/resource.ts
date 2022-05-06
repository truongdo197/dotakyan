import Ken from '$entities/Ken';
import Resource from '$entities/Resource';
import { ErrorCode, ResourceType, ResourceKey } from '$enums/common';
import { getKeyCacheResource, handleOutputPaging } from '$helpers/utils';
import { IAddResource, IUpdateResource, IListResource, IUpdateStatusResource } from '$interfaces/resource';
import { ResourceRepository } from '$repositories/ResourceRepository';
import { getConnection, getRepository } from 'typeorm';

export async function getListResource(params: IListResource) {
  const queryBuilder = getRepository(Resource)
    .createQueryBuilder('resource')
    .select([
      'resource.id',
      'resource.name',
      'resource.status',
      'resource.order',
      'resource.type',
      'resource.createdBy',
    ])
    .take(params.take)
    .skip(params.skip);
  if (params.keyword) queryBuilder.where('resource.name like :name', { name: `%${params.keyword}%` });
  if (params.status) {
    queryBuilder.andWhere('resource.status = :status', { status: params.status });
  }
  const [data, total] = await queryBuilder.getManyAndCount();
  return handleOutputPaging(data, total, params);
}

export async function createResource(userId: number, params: IAddResource) {
  params.createdBy = userId;
  return await getRepository(Resource).save(params);
}

export async function updateResource(resourceId: number, params: IUpdateResource) {
  await getConnection().queryResultCache.remove([ResourceKey.RESOURCE]);
  await getRepository(Resource).update(resourceId, { ...params });
  return;
}

export async function updateStatusResource(resourceId: number, params: IUpdateStatusResource) {
  await getConnection().queryResultCache.remove([ResourceKey.RESOURCE]);
  return await getRepository(Resource).update(resourceId, { ...params });
}

export async function getDetailResource(resourceId: number) {
  const resourcre = await getRepository(Resource).findOne(resourceId);
  if (!resourcre) ErrorCode.Not_Found;
  return resourcre;
}
