import Role from '$entities/Role';
import User from '$entities/User';
import { CommonStatus, ErrorCode } from '$enums/common';
import { assignThumbURL, handleOutputPaging } from '$helpers/utils';
import { IListUser, IupdateUser, IupdatePassUser, IcreateUser } from '$interfaces/user';
import { compareSync, hashSync } from 'bcryptjs';
import config from '$config';
import { getRepository } from 'typeorm';

export async function getListUser(params: IListUser) {
  const userRepo = getRepository(User);
  const queryBuilder = userRepo
    .createQueryBuilder('u')
    .select([
      'u.id id',
      'u.username username',
      'u.fullName fullName',
      'u.email email',
      'u.mobile mobile',
      'u.avatar avatar',
      'u.status status',
      'r.roleName roleName',
      'r.isSystem isSystem',
    ])
    .innerJoin(Role, 'r', 'r.id = u.roleId');
  if (params.keyword && params.keyword !== '')
    queryBuilder.where('(u.username like :username or u.email like :email)', {
      username: `%${params.keyword}%`,
      email: `%${params.keyword}%`,
    });
  const totalItems = await queryBuilder.getCount();
  const result = await queryBuilder.limit(params.take).offset(params.skip).orderBy('u.createdAt', 'DESC').getRawMany();
  assignThumbURL(result, 'avatar');
  return handleOutputPaging(result, totalItems, params);
}

export async function createUser(params: IcreateUser) {
  const userRepo = getRepository(User);
  const user = await userRepo.findOne({
    where: [{ username: params.username }, { email: params.email }, { mobile: params.mobile }],
  });
  if (user) {
    if (user.username === params.username) throw ErrorCode.Username_Already_exist;
    if (user.email === params.email) throw ErrorCode.Email_Already_exist;
    if (user.mobile === params.mobile) throw ErrorCode.Phone_Number_Already_exist;
  }
  params.password = hashSync(params.password, config.auth.SaltRounds);
  return await userRepo.save(params);
}

export async function getDetailUser(id: number) {
  const user = await getRepository(User).findOne(id, {
    select: ['id', 'username', 'fullName', 'email', 'mobile', 'roleId', 'avatar'],
  });
  if (!user) throw ErrorCode.Not_Found;
  return user;
}

export async function updateUser(id: number, params: IupdateUser) {
  const userRepo = getRepository(User);
  const user = await userRepo.findOne(id);
  if (!user) throw ErrorCode.Not_Found;
  await userRepo.update(id, params);
  return;
}

export async function updateStatusUser(id: number, status: number) {
  const userRepo = getRepository(User);
  const queryBuilder = await userRepo
    .createQueryBuilder('u')
    .select(['u. status', 'r.isSystem isSystem'])
    .innerJoin(Role, 'r', 'r.id = u.roleId')
    .where('u.id = :id', { id: id })
    .getRawOne();
  if (!queryBuilder) throw ErrorCode.Not_Found;
  if (queryBuilder.isSystem === CommonStatus.INACTIVE) {
    return await userRepo.update(id, { status: status });
  } else throw ErrorCode.Access_Denied;
}

export async function updatePasswordUser(id: number, params: IupdatePassUser) {
  const repoUser = getRepository(User);
  const { oldPassword, newPassword } = params;
  if (oldPassword === newPassword) throw ErrorCode.Invalid_Input;

  const user = await repoUser.findOne(id, { select: ['password'] });
  if (!user) throw ErrorCode.User_Not_Exist;

  const isTruePassword = compareSync(oldPassword, user.password);
  if (!isTruePassword) throw ErrorCode.Username_Or_Password_Invalid;

  const passwordHash = hashSync(newPassword, config.auth.SaltRounds);
  await repoUser.update(id, { password: passwordHash });
}
