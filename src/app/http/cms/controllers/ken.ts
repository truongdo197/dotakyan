import { addKenSchema, listKenSchema, updateKenSchema, updateStatusKenSchema } from '$cms/validators/ken';
import { ErrorCode, Permissions } from '$enums/common';
import { validate } from '$helpers/ajv';
import { CMS, Get, Post, Put, RequirePermission } from '$helpers/decorator';
import { handleInputPaging } from '$helpers/utils';
import * as service from '$cms/services/ken';
import { Request, Response } from 'express';
import { add } from 'lodash';
import { done } from '$helpers/response';

@CMS('/ken')
export default class CMSKenController {
  @Get('/')
  @RequirePermission([Permissions.RESOURCE_MANAGEMENT])
  async getListKen(req: Request) {
    const params = handleInputPaging(req.query);
    validate(listKenSchema, params);
    return await service.getListKen(params);
  }

  @Post('/')
  @RequirePermission([Permissions.RESOURCE_MANAGEMENT])
  async createKen(req: Request, res: Response) {
    const body = req.body;
    const userId = req.userId;
    validate(addKenSchema, body);
    await service.createKen(userId, body);
    return done(res);
  }

  @Get('/:kenId')
  @RequirePermission([Permissions.RESOURCE_MANAGEMENT])
  async getDetailKen(req: Request, res: Response) {
    const kenId = Number(req.params.kenId);
    if (!kenId) throw ErrorCode.Invalid_Input;
    return await service.getDetailKen(kenId);
  }

  @Put('/:kenId')
  @RequirePermission([Permissions.RESOURCE_MANAGEMENT])
  async updateKen(req: Request, res: Response) {
    const body = req.body;
    validate(updateKenSchema, body);
    const kenId = Number(req.params.kenId);
    if (!kenId) throw ErrorCode.Invalid_Input;
    await service.updateKen(kenId, body);
    return done(res);
  }

  @Put('/update-status/:kenId')
  @RequirePermission([Permissions.RESOURCE_MANAGEMENT])
  async updateStatusKen(req: Request, res: Response) {
    const body = req.body;
    validate(updateStatusKenSchema, body);
    const kenId = Number(req.params.kenId);
    if (!kenId) throw ErrorCode.Invalid_Input;
    await service.updateStatusKen(kenId, body);
    return done(res);
  }
}
