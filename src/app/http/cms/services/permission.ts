import { getRepository, getConnection, Not, In } from 'typeorm';
import Permission from '$entities/Permission';
import Role from '$entities/Role';
import { CommonStatus, ErrorCode, Permissions } from '$enums/common';
import { convertToObject } from '$helpers/utils';
import RolePermission from '$entities/RolePermission';
import UserPermission from '$entities/UserPermission';
import User from '$entities/User';

export async function getListPermissions() {
  return await getRepository(Permission).find();
}

export async function getListRole() {
  return await getRepository(Role).find({ isVisible: CommonStatus.ACTIVE });
}

export async function addRole(roleName: string) {
  return await getRepository(Role).save({ roleName });
}

export async function updateRole(roleId: number, roleName: string) {
  return await getRepository(Role).update(roleId, { roleName });
}

export async function hiddenRole(roleId: number) {
  return await getRepository(Role).update(roleId, { isVisible: CommonStatus.INACTIVE });
}

export async function getPermissionByGroup(permissions: Array<number>) {
  const repoPermission = getRepository(Permission);
  const getListPermissions = await repoPermission
    .createQueryBuilder('permission')
    .select([
      'permission.id id',
      'permission.name name',
      'permission.groupId groupId',
      'permissionGroup.name groupName',
    ])
    .innerJoin('PermissionGroup', 'permissionGroup', 'permission.groupId = permissionGroup.id')
    .getRawMany();
  const listPermissionAdvance = getListPermissions.map((item) => {
    item.hasPermission = permissions.includes(item.id) ? 1 : 0;
    return item;
  });
  return convertToObject(listPermissionAdvance, 'groupName');
}

export async function getRolePermissions(roleId: number) {
  const repoRole = getRepository(Role);
  const role = await repoRole.findOne(roleId);
  if (!role) throw ErrorCode.Not_Found;
  const repoRolePermission = getRepository(RolePermission);
  const getRolePermissions = await repoRolePermission.find({ roleId });
  const rolePermissions: Array<number> = getRolePermissions.map((item) => item.permissionId);
  return getPermissionByGroup(rolePermissions);
}

export async function updateRolePermissions(roleId: number, permissions: Array<number>, changeUserPermission: 0 | 1) {
  await getConnection().transaction(async (transaction) => {
    const RolePermissionRepository = transaction.getRepository(RolePermission);
    const roleRepository = transaction.getRepository(Role);
    const userPermissionRepository = transaction.getRepository(UserPermission);
    const userRepository = transaction.getRepository(User);

    const role = await roleRepository.findOne(roleId);
    if (!role) throw ErrorCode.Not_Found;

    await RolePermissionRepository.delete({ roleId: roleId, permissionId: Not(In([...permissions, -1])) });
    const dataUpdateRolePermissions = permissions.map((item) => {
      return { roleId, permissionId: item };
    });
    await RolePermissionRepository.save(dataUpdateRolePermissions);

    if (changeUserPermission) {
      const users = await userRepository.find({ where: { roleId }, select: ['id', 'roleId'] });
      const userIds = users.map(item => item.id);

      await userPermissionRepository.delete({ userId: In([...userIds, -1]), permissionId: Not(In([...permissions, -1])) })

      const dataUserPermission = users.reduce((acc, cur) => {
        const userPermissions = permissions.map(item => ({ userId: cur.id, permissionId: item }));
        acc.push(...userPermissions);
        return acc;
      }, []);
      await userPermissionRepository.save(dataUserPermission)
    }
  });
  return;
}

export async function getUserPermissions(userId: number) {
  const repoUserPermission = getRepository(UserPermission);
  const userPermission = await repoUserPermission.find({ userId });
  const permissions = userPermission.map((permission) => permission.permissionId);
  return getPermissionByGroup(permissions);
}

export async function updateUserPermissions(userId: number, permissions: number[]) {
  await getConnection().transaction(async (transaction) => {
    const repoUserPermission = transaction.getRepository(UserPermission);
    await repoUserPermission.delete({ userId, permissionId: Not(999) });
    const data = permissions.map((permissionId) => ({ userId, permissionId }));
    await repoUserPermission.save(data);
  });
  return;
}

export async function getRolePermissionIds(roleId: number): Promise<number[]> {
  const repoRole = getRepository(Role);
  const role = await repoRole.findOne({ id: roleId });
  if (!role) throw ErrorCode.Not_Found;
  const repoRolePermission = getRepository(RolePermission);
  const getRolePermissions = await repoRolePermission.find({ roleId });
  const rolePermissions: Array<number> = getRolePermissions.map((item) => item.permissionId);
  return rolePermissions;
}
