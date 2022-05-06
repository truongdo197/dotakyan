import Resource from '$entities/Resource';
import {EntityRepository, getConnection, Repository} from "typeorm";

@EntityRepository(Resource)
export class ResourceRepository extends Repository<Resource> {

  async clearCacheByKeys(keys: Array<string>) {
    return await this.manager.connection.queryResultCache.remove(keys)
  }

  /**
   * Save single resource and clear cache by cacheKey
   */
  async saveResource(resource: Resource, cacheKey: string) {
    await this.clearCacheByKeys([cacheKey])
    return this.save(resource);
  }

  /**
   * update single resource and clear cache by cacheKey
   */
  async updateResource(conditions: Resource, resource: Resource, cacheKey: string) {
    await this.clearCacheByKeys([cacheKey])
    return this.update(conditions, resource);
  }

  /**
   * Delete single resource and clear cache by cacheKey
   */
  async deleteResource(conditions: Resource, cacheKey: string) {
    await this.clearCacheByKeys([cacheKey])
    return this.delete(conditions);
  }

}