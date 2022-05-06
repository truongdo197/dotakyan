import { APP, Get, Post } from '$helpers/decorator';
import * as subscription from '$app/services/subscription';
import { Request } from 'express';
import { ErrorHandler } from '$helpers/response';
import { ErrorCode } from '$enums/common';
import { validate } from '$helpers/ajv';
import { buySubscriptionSchema } from '$app/validators/subscription';
import { updateProfileAuthentication } from '$middlewares/app';

@APP('/subscription')
export default class APPSubscriptionController {
  @Get('/', [updateProfileAuthentication])
  async getListSubscription() {
    return await subscription.getListSubscriptions();
  }

  @Post('/buy', [updateProfileAuthentication])
  async buySubscription(req: Request) {
    const { body, memberId } = req;
    const subscriptionId = req.body.subscriptionId;
    validate(buySubscriptionSchema, body);
    await subscription.buySubscription(memberId, subscriptionId);
    return;
  }
}
