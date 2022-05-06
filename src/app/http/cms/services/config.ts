import Config from '$entities/Config';
import { ErrorCode, ResourceKey } from '$enums/common';
import { handleOutputPaging } from '$helpers/utils';
import { IUpdateconfig, IListconfig } from '$interfaces/config';
import { getConnection, getRepository } from 'typeorm';

export async function getListConfig(params: any) {
  const configRepo = getRepository(Config);
  const configs = configRepo
    .createQueryBuilder('config')
    .select([
      'config.key',
      'config.name',
      'config.value',
      'config.type',
      'config.order',
      'config.metadata',
      'config.isSystem',
      'config.createdBy',
    ]);

  if (params.keyword) configs.where('config.name like :name', { name: `%${params.keyword}%` });

  return await configs.getMany();
}

export async function updateConfig(key: string, params: IUpdateconfig) {
  await getConnection().queryResultCache.remove([ResourceKey.CONFIG]);
  return await getRepository(Config).update(key, params);
}

export async function getDetailConfig(key: string) {
  const config = await getRepository(Config).findOne(key);
  if (!config) ErrorCode.Not_Found;
  return config;
}
