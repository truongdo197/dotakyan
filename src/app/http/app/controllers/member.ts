import { Response, Request } from 'express';
import { APP, Get, Post, Put } from '$helpers/decorator';
import { validate } from '$helpers/ajv';
import * as member from '$app/services/member';
import rateLimit from 'express-rate-limit';
import {
  updateProfileSchema,
  updateGeoLocation,
  addFollowJob,
  updateSettingNotificationSchema,
  updateShareLocationStatus,
} from '$app/validators/member';
import { UpdateMemberRequest, UpdateGeolocationRequest } from '$interfaces/member';
import { UpdateGeolocation } from '$http/modules/queue';
import { checkTokenApp, updateProfileAuthentication } from '$middlewares/app';
import { get } from 'lodash';
import { ErrorCode } from '$enums/common';
import { ErrorHandler } from '$helpers/response';
import { handleInputPaging } from '$helpers/utils';
//config rate limit
const limiter = rateLimit({
  windowMs: 3 * 1000, // 3s
  max: 1, // 1req
  message: `{
    "success": false,
    "errorCode": -1,
    "errorMessage": "Maximum_Request",
    "data": null
}`,
});

@APP('/member')
export default class APPMemberController {
  @Put('/profile', [updateProfileAuthentication])
  async updateMemberProfile(req: UpdateMemberRequest) {
    const memberId = req.memberId;
    const body = req.body;
    validate(updateProfileSchema, body);
    return await member.updateProfile(memberId, body);
  }

  @Get('/profile', [updateProfileAuthentication])
  async getMemberProfile(req: UpdateMemberRequest) {
    const memberId = req.memberId;
    return await member.getMemberProfile(memberId);
  }

  @Put('/geolocation', [checkTokenApp, limiter])
  async updateMemberGeolocation(req: UpdateGeolocationRequest) {
    const data = req.body;
    const memberId = req.memberId;
    validate(updateGeoLocation, data);
    await UpdateGeolocation.add('Update-Geolocation', { memberId, data });
    return;
  }

  @Get('/process-update-info', [updateProfileAuthentication])
  async getProcessInformation(req: UpdateGeolocationRequest) {
    const memberId = req.memberId;
    const process = await member.getProcessUpdateInformation(memberId);
    return { process };
  }

  @Post('/job-follow', [updateProfileAuthentication])
  async addJobFollow(req: Request) {
    const memberId = req.memberId;
    const body = req.body;
    validate(addFollowJob, body);
    await member.updateJobFollow(memberId, body.jobIds);
    return;
  }

  @Get('/job-follow')
  async getJobFollow(req: Request) {
    const memberId = req.memberId;
    const jobIds = await member.getFollowJobs(memberId);
    return { jobIds };
  }

  @Get('/:targetId/profile')
  async getProfileOfMember(req: Request) {
    const targetId = Number(req.params.targetId);
    const memberId = req.memberId;
    if (targetId === memberId) return ErrorCode.Access_Denied;
    if (!targetId || targetId <= 0) throw ErrorCode.Invalid_Input;
    const conversationId = Number(req.query.conversationId);
    const result = await member.getProfileOfMember(memberId, targetId, conversationId);
    return result;
  }

  @Post('/:targetId/favorite')
  async favoriteMember(req: Request) {
    const memberId = req.memberId;
    const targetId = Number(req.params.targetId);
    if (targetId === memberId) return ErrorCode.Access_Denied;
    if (!targetId || targetId <= 0) throw ErrorCode.Invalid_Input;
    const result = await member.favoriteMember(memberId, targetId);
    return result;
  }

  @Post('/setting-notification')
  async updateSettingNotification(req: Request) {
    const body = req.body;
    const memberId = req.memberId;
    validate(updateSettingNotificationSchema, body);
    const result = await member.updateSettingReceiveNotification(memberId, body.notificationStatus);
    return result;
  }

  @Put('/setting-share-location')
  async settingOnOffShareLocation(req: Request) {
    const body = req.body;
    const memberId = req.memberId;
    validate(updateShareLocationStatus, body);
    const result = await member.settingOnOffShareLocation(memberId, body);
    return result;
  }

  @Get('/list-favorite')
  async getListFavorite(req: Request) {
    const query = handleInputPaging(req.query);
    const memberId = req.memberId;
    const result = await member.getListMembersFavorite(memberId, query);
    return result;
  }

  @Post('/block-member')
  async blockMember(req: Request) {
    const memberId = req.memberId;
    const { targetId } = req.body;
    if (!Number(targetId)) throw ErrorCode.Invalid_Input;
    await member.blockMember(memberId, targetId);
    return;
  }

  @Post('/unblock-member')
  async unblockMember(req: Request) {
    const memberId = req.memberId;
    const { targetId } = req.body;
    if (!Number(targetId)) throw ErrorCode.Invalid_Input;
    await member.unblockMember(memberId, targetId);
    return;
  }
}
