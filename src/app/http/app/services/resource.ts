import config from '$config';
import Ken from '$entities/Ken';
import Resource from '$entities/Resource';
import { CommonStatus, ResourceKey, ResourceType } from '$enums/common';
import { getKeyCacheResource } from '$helpers/utils';
import { ResourceRepository } from '$repositories/ResourceRepository';
import { getCustomRepository, getRepository, Repository } from 'typeorm';

export async function getAllResource() {
  const resourceRepository = getRepository(Resource);
  const kenRepository = getRepository(Ken);
  const resource = {};
  resource['jobs'] = await getAllJobs(resourceRepository);
  resource['kens'] = await getAllKens(kenRepository);
  return resource;
}

export async function getAllJobs(resourceRepository: Repository<Resource>) {
  const jobs = await resourceRepository.find({
    select: ['id', 'name', 'order', 'type', 'status'],
    where: { type: ResourceType.JOB, status: CommonStatus.ACTIVE },
    order: { order: 'ASC', createdAt: 'DESC' },
    cache: {
      id: ResourceKey.JOB,
      milliseconds: config.cacheExpire,
    },
  });
  return jobs;
}

export async function getAllKens(kenRepository: Repository<Ken>) {
  const kens = await kenRepository.find({
    select: ['id', 'name', 'order', 'status'],
    where: { status: CommonStatus.ACTIVE },
    order: { order: 'ASC', createdAt: 'DESC' },
    cache: {
      id: ResourceKey.KEN,
      milliseconds: config.cacheExpire,
    },
  });
  return kens;
}

export async function saveResource(params: Resource) {
  const keyCache = getKeyCacheResource(params.type);
  const resourceRepository = getCustomRepository(ResourceRepository);
  return await resourceRepository.saveResource(params, keyCache);
}
