import config from '$config';
import Member from '$entities/Member';
import MemberGeolocation from '$entities/MemberGeolocation';
import { CommonStatus, ConversationMemberStatus, MemberType, ShareLocationStatus } from '$enums/common';
import { assignThumbURL, handleOutputPaging } from '$helpers/utils';
import { ISearchMemberParams } from '$interfaces/search';
import { getManager, getRepository } from 'typeorm';
import { getListConversationKicked, getMemberConversationImages } from './conversation';
import { getListMemberBlock } from './member';

export async function searchMember(memberId: number, params: ISearchMemberParams) {
  const manager = getManager();
  let distance =
    Number(params.distance) && Number(params.distance) > 0 ? Number(params.distance) : config.distanceSearch;
  let conditions = '';
  let parameters = [];

  const ignoreIds = await getListMemberBlock(memberId);
  parameters.push(ignoreIds);

  if (params.jobId) {
    conditions += ' AND m.job_id = ? ';
    parameters.push(params.jobId);
  }

  if (params.age) {
    conditions += `AND TIMESTAMPDIFF(YEAR, STR_TO_DATE(m.birthday, '%Y-%m-%d'), CURRENT_DATE) = ?`;
    parameters.push(params.age);
  }

  if (params.jobsFollow && params.jobsFollow.length > 0) {
    conditions += ' AND jf.job_id IN (?) ';
    parameters.push(params.jobsFollow);
  }

  const countQuery = `
    SELECT 
      COUNT(DISTINCT(m.id)) as count
    FROM
      member m
    LEFT JOIN member_geolocation mg ON
      m.id = mg.member_id
    LEFT JOIN job_follow jf ON jf.member_id = m.id
    LEFT JOIN conversation_member cm ON cm.member_id = m.id AND cm.member_type = ${MemberType.APP}
    LEFT JOIN group_detail gd ON cm.conversation_id = gd.conversation_id
    WHERE m.id != ${memberId}
    AND m.id NOT IN(?)
    AND (m.share_location_status = 1 OR (m.share_location_status = 2 AND m.share_location_expire > CURRENT_TIMESTAMP))
    AND m.id NOT IN (SELECT id FROM member WHERE subscription_id IS NULL OR (subscription_id IS NOT NULL AND subscription_expire_at < CURRENT_TIMESTAMP) )
    AND ((gd.time_start IS NULL AND gd.time_end IS NULL) OR gd.time_start > CURRENT_TIMESTAMP OR gd.time_end < CURRENT_TIMESTAMP)
    AND (ST_Distance_Sphere(
        ST_GeomFromText( CONCAT('POINT(', mg.lat, ' ', mg.lng, ')'), 4326),
        ST_GeomFromText('POINT(${params.lat} ${params.lng})', 4326)
      ) / 1000) < ${distance} ${conditions};
    `;
  const resultSql = `
    SELECT DISTINCT(m.id),
      m.id,
      m.name,
      m.avatar,
      m.introduce,
      m.birthday birthday,
      mg.lat,
      mg.lng,
      mg.update_at updateAt,
      ST_Distance_Sphere(
        ST_GeomFromText( CONCAT('POINT(', mg.lat, ' ', mg.lng, ')'), 4326),
        ST_GeomFromText('POINT(${params.lat} ${params.lng})', 4326)
      ) / 1000 as distanceGeo
    FROM
      member m
    LEFT JOIN member_geolocation mg ON
      m.id = mg.member_id
    LEFT JOIN job_follow jf ON jf.member_id = m.id
    LEFT JOIN conversation_member cm ON cm.member_id = m.id AND cm.member_type = ${MemberType.APP}
    LEFT JOIN group_detail gd ON cm.conversation_id = gd.conversation_id
    WHERE 
    m.status = ${CommonStatus.ACTIVE}
    AND m.id != ${memberId}
    AND m.id NOT IN(?)
    AND m.id NOT IN (SELECT id FROM member WHERE subscription_id IS NULL OR (subscription_id IS NOT NULL AND subscription_expire_at < CURRENT_TIMESTAMP) )
    ${conditions}
    AND (m.share_location_status = 1 OR (m.share_location_status = 2 AND m.share_location_expire > CURRENT_TIMESTAMP))
    AND ((gd.time_start IS NULL AND gd.time_end IS NULL) OR gd.time_start > CURRENT_TIMESTAMP OR gd.time_end < CURRENT_TIMESTAMP)
    HAVING distanceGeo < ${distance} ORDER  BY distanceGeo ASC LIMIT ${params.skip}, ${params.take};`;

  const count = await manager.query(countQuery, parameters);
  const result = await manager.query(resultSql, parameters);
  assignThumbURL(result, 'avatar');
  return handleOutputPaging(result, count[0].count, params);
}

export async function searchGroup(memberId: number, params) {
  const manager = getManager();
  const parameters = [];

  let distance =
    Number(params.distance) && Number(params.distance) > 0 ? Number(params.distance) : config.distanceSearch;
  let conditions = '';

  const ignoreIds = await getListConversationKicked(memberId);
  parameters.push(ignoreIds);

  if (params.timeStart && params.timeEnd) {
    conditions += ` AND gd.time_start >= ? AND gd.time_end <= ? `;
    parameters.push(params.timeStart, params.timeEnd);
  }

  if (params.keyword) {
    conditions += ` AND (LOWER(c.conversation_name) LIKE ? OR LOWER(gd.location_name) LIKE ?) `;
    parameters.push(`%${params.keyword.toLowerCase()}%`, `%${params.keyword.toLowerCase()}%`);
  }

  const sql = `SELECT DISTINCT(c.id),
    c.id,
    c.conversation_name groupName,
    c.conversation_type conversationType,
    gd.location_name locationName ,
    gd.description,
    gd.lat,
    gd.lng,
    gd.status,
    gd.description,
    gd.time_start timeStart,
    gd.time_end timeEnd,
    ST_Distance_Sphere(
      ST_GeomFromText( CONCAT('POINT(', gd.lat, ' ', gd.lng, ')'), 4326),
      ST_GeomFromText('POINT(${params.lat} ${params.lng})', 4326)
    ) / 1000 as distanceGeo
  FROM
    group_detail gd
  INNER JOIN conversation c ON
    c.id = gd.conversation_id
  WHERE
    gd.status = ${CommonStatus.ACTIVE}
    AND gd.conversation_id NOT IN(?) 
    AND gd.time_end > CURRENT_TIMESTAMP
    ${conditions}
  HAVING
    distanceGeo < ${distance}`;

  const countQuery = `SELECT  
      COUNT(DISTINCT(gd.conversation_id)) as count
    FROM
      group_detail gd
    INNER JOIN conversation c ON
      c.id = gd.conversation_id
    WHERE
      gd.status = ${CommonStatus.ACTIVE}
      AND gd.conversation_id NOT IN(?)
      AND gd.time_end > CURRENT_TIMESTAMP
      ${conditions}
    AND
      ST_Distance_Sphere(
        ST_GeomFromText( CONCAT('POINT(', gd.lat, ' ', gd.lng, ')'), 4326),
        ST_GeomFromText('POINT(${params.lat} ${params.lng})', 4326)
      ) / 1000 < ${distance}`;

  const totalItems = await manager.query(countQuery, parameters);
  const result = await manager.query(sql, parameters);

  await getMemberConversationImages(result);

  return handleOutputPaging(result, totalItems[0].count, params);
}

export async function searchMap(memberId: number, params) {
  const manager = getManager();
  const parameters = [];
  let distance =
    Number(params.distance) && Number(params.distance) > 0 ? Number(params.distance) : config.distanceSearch;

  const ignoreIds = await getListMemberBlock(memberId);
  parameters.push(ignoreIds);

  const ignoreGroupIds = await getListConversationKicked(memberId);
  parameters.push(ignoreGroupIds);

  const sql = `
  # List member near
  SELECT DISTINCT
    m.id,
    0 as isGroup,
    m.avatar,
    m.name,
    mg.lat,
    mg.lng,
    0 as total,
    ST_Distance_Sphere( ST_GeomFromText( CONCAT('POINT(', mg.lat, ' ', mg.lng, ')'), 4326), ST_GeomFromText('POINT(${params.lat} ${params.lng})', 4326) ) / 1000 as distanceGeo
  FROM
    member m
  LEFT JOIN member_geolocation mg ON
    m.id = mg.member_id
  LEFT JOIN conversation_member cm ON cm.member_id = m.id AND cm.member_type = ${MemberType.APP}
  LEFT JOIN group_detail gd ON cm.conversation_id = gd.conversation_id
  WHERE
    m.id != ${memberId}
    AND m.id NOT IN(?)
    AND m.id NOT IN (SELECT id FROM member WHERE subscription_id IS NULL OR (subscription_id IS NOT NULL AND subscription_expire_at < CURRENT_TIMESTAMP) )
    AND (m.share_location_status = ${ShareLocationStatus.ACTIVE}
    OR (m.share_location_status = ${ShareLocationStatus.SHORT_TIME}
    AND m.share_location_expire > CURRENT_TIMESTAMP))
    AND ((gd.time_start IS NULL AND gd.time_end IS NULL) OR gd.time_start > CURRENT_TIMESTAMP OR gd.time_end < CURRENT_TIMESTAMP)
  HAVING
    distanceGeo < ${distance}
    
  UNION ALL
  
  # List group near
  SELECT DISTINCT
    c.id,
    1 as isGroup,
    m.avatar,
    c.conversation_name name,
    gd.lat,
    gd.lng,
    (
    SELECT
      COUNT(1)
    FROM
      conversation_member cm2
    WHERE
      cm2.conversation_id = c.id
      AND cm2.status = ${ConversationMemberStatus.ACTIVE})as total,
    ST_Distance_Sphere( ST_GeomFromText( CONCAT('POINT(', gd.lat, ' ', gd.lng, ')'), 4326), ST_GeomFromText('POINT(${params.lat} ${params.lng})', 4326) ) / 1000 as distanceGeo
  FROM
    group_detail gd
  INNER JOIN conversation c ON
    c.id = gd.conversation_id
  INNER JOIN conversation_member cm ON
    cm.is_admin = ${CommonStatus.ACTIVE}
    AND cm.conversation_id = c.id
  INNER JOIN member m ON
    cm.member_id = m.id
  WHERE
    gd.status = ${CommonStatus.ACTIVE}
    AND c.id NOT IN(?)
    AND gd.time_end > CURRENT_TIMESTAMP
  HAVING
    distanceGeo < ${distance}`;

  const result = await manager.query(sql, parameters);
  assignThumbURL(result, 'avatar');
  return result;
}
