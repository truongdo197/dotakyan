import { APP, Get, Post, Put } from '$helpers/decorator';
import * as notification from '$app/services/notification';
import { Request } from 'express';
import { ErrorHandler } from '$helpers/response';
import { ErrorCode } from '$enums/common';
import { validate } from '$helpers/ajv';
import { handleInputPaging } from '$helpers/utils';
import { updateGeoLocationSchema } from '$http/app/validators/notification';

@APP('/notification')
export default class APPSubscriptionController {
  @Get('/list')
  async getListNotifications(req: Request) {
    const memberId = req.memberId;
    const query = handleInputPaging(req.query);
    return await notification.getListNotifications(memberId, query);
  }

  @Put('/read-notification')
  async readMessage(req: Request) {
    const memberId = req.memberId;
    const body = req.body;
    validate(updateGeoLocationSchema, body);
    return await notification.readNotification({ memberId, ...body });
  }
}
