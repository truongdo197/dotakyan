import LanguageKey from '$entities/LanguageKey';
import LanguageTranslation from '$entities/LanguageTranslation';
import Member from '$entities/Member';
import { CommonStatus } from '$enums/common';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(LanguageKey)
export class LanguageKeyRepository extends Repository<LanguageKey> {
  getLanguageByKey(key: string, language: string = 'ja') {
    const queryBuilder = this.createQueryBuilder('l')
      .select(['IF(lt.value, lt.value, l.defaultValue) as value', 'l.key lKey'])
      .leftJoin(LanguageTranslation, 'lt', 'lt.key = l.key AND lt.environment = l.environment')
      .where('l.key = :key', { key })
      .andWhere('lt.code = :language', { language });
    return queryBuilder.getRawOne();
  }
}
