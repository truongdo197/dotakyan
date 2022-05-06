import Member from '$entities/Member';
import { getRepository, EntityManager, getConnection, Repository, MoreThan } from 'typeorm';
import {
  LoginParams,
  Token,
  ChangePasswordParams,
  RegisterParams,
  ForgotPasswordParams,
  ILoginResult,
} from '$interfaces/app.auth';
import { ErrorCode, UserStatus, VerificationCodeStatus, VerificationType } from '$enums/common';
import { compareSync, hashSync } from 'bcryptjs';
import { getKeyCacheMember, randomPassword } from '$helpers/utils';
import { sign, verify } from 'jsonwebtoken';
import { pick } from 'lodash';
import { promisify } from 'util';
import to from 'await-to-js';
import config from '$config';
import VerificationCode from '$entities/VerificationCode';
import { randomOTP } from '$helpers/utils';
import { ErrorHandler } from '$helpers/response';
import MemberGeolocation from '$entities/MemberGeolocation';
import { getProcessUpdateInformation } from './member';
import { sendMessageSMS } from '$helpers/sms';
import moment from 'moment';
const verifyAsync = promisify(verify) as any;

export async function getMemberInformationById(memberId: number, memberRepository?: Repository<Member>) {
  memberRepository = memberRepository ? memberRepository : getRepository(Member);
  return await getRepository(Member).findOne({
    where: { id: memberId },
    select: ['id', 'status', 'subscriptionId', 'subscriptionExpireAt', 'name', 'refreshToken'],
    cache: {
      id: getKeyCacheMember(memberId),
      milliseconds: 1000 * 10, // 10s
    },
  });
}

export async function login({ phone, password }: LoginParams): Promise<ILoginResult> {
  return await getConnection().transaction(async (transaction: EntityManager) => {
    const memberRepository = transaction.getRepository(Member);

    const member = await memberRepository.findOne({ phone }, { select: ['id', 'password'] });

    if (!member) throw ErrorCode.Phone_Number_Or_Password_Invalid;
    if (member.status === UserStatus.INACTIVE) throw ErrorCode.User_Blocked;

    const isTruePassword = compareSync(password, member.password);
    if (!isTruePassword) throw ErrorCode.Username_Or_Password_Invalid;
    const result = await generateToken(member.id, memberRepository);

    const process = await getProcessUpdateInformation(member.id);
    return { memberId: member.id, process, ...result };
  });
}

export async function register({ phone, password, code }: RegisterParams) {
  const result = await getConnection().transaction(async (transaction) => {
    const memberRepository = transaction.getRepository(Member);
    const memberGeolocationRepository = transaction.getRepository(MemberGeolocation);
    const verificationCodeRepository = transaction.getRepository(VerificationCode);

    const isPhoneExist = await isPhoneNumberExist(phone);
    if (isPhoneExist) throw ErrorCode.Phone_Number_Already_exist;

    // Check verify code
    const codeObject = await verifyOTPCode(verificationCodeRepository, {
      phone,
      code,
      type: VerificationType.REGISTER,
    });
    if (!codeObject) throw ErrorCode.Verification_Code_Invalid;
    await verificationCodeRepository.update({ id: codeObject.id }, { status: VerificationCodeStatus.USED });

    const newPassword = hashSync(password, config.auth.SaltRounds);
    const member = await memberRepository.save({ phone, password: newPassword });
    await memberGeolocationRepository.save({ memberId: member.id });
    return { memberId: member.id };
  });
  result['token'] = await generateToken(result.memberId);
  return result;
}

export async function requestVerificationCode(phone: string, type: VerificationType) {
  const verificationRepository = getRepository(VerificationCode);

  if (type === VerificationType.REGISTER) {
    const isPhoneExist = await isPhoneNumberExist(phone);
    if (isPhoneExist) throw ErrorCode.Phone_Number_Already_exist;
  }

  const code = randomOTP(5);
  const currentUnixTimeStamp = new Date().getTime();
  const expireDate = new Date(currentUnixTimeStamp + config.auth.VerificationCodeExpire).toISOString();

  const codeObject = await verificationRepository.findOne({
    phone,
    type,
    status: VerificationCodeStatus.ACTIVE,
    expireDate: MoreThan(new Date().toISOString()),
  });

  if (codeObject && codeObject.retry >= 5) throw ErrorCode.Maximum_Retry_Verification_Code;

  if (codeObject) {
    await verificationRepository.update({ id: codeObject.id }, { retry: codeObject.retry + 1, code });
    if (config.environment !== 'development') {
      sendMessageSMS(type, phone, code);
      return;
    } else return code;
  }

  await verificationRepository.save({ phone, code, type, expireDate });

  if (config.environment !== 'development') {
    sendMessageSMS(type, phone, code);
    return;
  } else return code;
}

export async function verifyOTPCode(verificationRepository: Repository<VerificationCode>, { phone, code, type }) {
  const codeObject = await verificationRepository.findOne({
    phone,
    type,
    code,
    status: VerificationCodeStatus.ACTIVE,
    expireDate: MoreThan(new Date().toISOString()),
  });
  return codeObject;
}

export async function generateToken(memberId: number, memberRepository?: Repository<Member>): Promise<Token> {
  memberRepository = memberRepository ? memberRepository : getRepository(Member);
  const member = await getMemberInformationById(memberId, memberRepository);

  const dataEncode = pick(member, ['id', 'status']);
  const token = generateAccessToken(dataEncode);
  const oldRefreshToken = member.refreshToken;

  const [error] = await to(verifyAsync(oldRefreshToken, config.auth.RefreshTokenSecret));

  if (error) {
    const dataEncodeRefreshToken = pick(member, ['id', 'status']);
    const newRefreshToken = generateRefreshToken(dataEncodeRefreshToken);
    const keyCacheMember = getKeyCacheMember(memberId);
    await Promise.all([
      memberRepository.update(memberId, { refreshToken: newRefreshToken }),
      getConnection().queryResultCache.remove([keyCacheMember]),
    ]);
    return { token, refreshToken: newRefreshToken };
  }

  return { token, refreshToken: oldRefreshToken };
}

export async function forgotPassword({ phone, code, newPassword }: ForgotPasswordParams): Promise<string> {
  return await getConnection().transaction(async (transaction) => {
    const verificationCodeRepository = transaction.getRepository(VerificationCode);
    const memberRepository = transaction.getRepository(Member);

    const isPhoneExist = await isPhoneNumberExist(phone, memberRepository);
    if (!isPhoneExist) throw ErrorCode.Phone_Number_Not_exist;

    const codeObject = await verificationCodeRepository.findOne({
      phone,
      type: VerificationType.FORGOT_PASSWORD,
      code,
      status: VerificationCodeStatus.ACTIVE,
    });
    if (!codeObject) throw ErrorCode.Verification_Code_Invalid;
    if (moment(codeObject.expireDate).isBefore()) throw ErrorCode.Verification_Code_Expire;

    await verificationCodeRepository.update({ id: codeObject.id }, { status: VerificationCodeStatus.USED });
    const passwordHash = hashSync(newPassword, config.auth.SaltRounds);
    await memberRepository.update({ phone }, { password: passwordHash });
    return newPassword;
  });
}

export async function checkValidForgotToken({ phone, code }) {
  return await getConnection().transaction(async (transaction) => {
    const verificationCodeRepository = transaction.getRepository(VerificationCode);

    const codeObject = await verifyOTPCode(verificationCodeRepository, {
      phone,
      code: code,
      type: VerificationType.FORGOT_PASSWORD,
    });

    if (!codeObject) throw ErrorCode.Verification_Code_Invalid;
    if (moment(codeObject.expireDate).isBefore()) throw ErrorCode.Verification_Code_Expire;

    return true;
  });
}

export async function createAccessToken(memberId: number): Promise<string> {
  const memberRepository = getRepository(Member);
  const member = await getMemberInformationById(memberId, memberRepository);
  const dataEncode = pick(member, ['id', 'status', 'subscriptionId', 'subscriptionExpireAt']);
  return generateAccessToken(dataEncode);
}

export async function changePassword(memberId: number, params: ChangePasswordParams) {
  const memberRepository = getRepository(Member);
  const { oldPassword, newPassword } = params;
  const user = await memberRepository.findOne(memberId, { select: ['password'] });
  if (!user) throw ErrorCode.User_Not_Exist;

  const isTruePassword = compareSync(oldPassword, user.password);
  if (!isTruePassword) throw ErrorCode.Username_Or_Password_Invalid;

  if (oldPassword === newPassword)
    throw new ErrorHandler(ErrorCode.Invalid_Input, 422, 'The new password cannot be same the old password');

  const passwordHash = hashSync(newPassword, config.auth.SaltRounds);
  await memberRepository.update(memberId, { password: passwordHash });
  return;
}

export async function isPhoneNumberExist(phone: string, memberRepository?: Repository<Member>) {
  memberRepository = memberRepository ? memberRepository : getRepository(Member);
  const isExist = await memberRepository.count({ phone });
  return !!isExist;
}

const generateAccessToken = (dataEncode) => {
  return sign(dataEncode, config.auth.AccessTokenSecret, {
    algorithm: 'HS256',
    expiresIn: config.auth.AccessTokenExpire,
  });
};

const generateRefreshToken = (dataEncode) => {
  return sign(dataEncode, config.auth.RefreshTokenSecret, {
    algorithm: 'HS256',
    expiresIn: config.auth.RefreshTokenExpire,
  });
};
