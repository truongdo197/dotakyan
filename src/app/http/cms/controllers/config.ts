import { listConfigSchema, updateConfigSchema } from '$cms/validators/config';
import { ErrorCode, Permissions } from '$enums/common';
import { validate } from '$helpers/ajv';
import { CMS, Get, Post, Put, RequirePermission } from '$helpers/decorator';
import { handleInputPaging } from '$helpers/utils';
import * as service from '$cms/services/config';
import { Request, Response } from 'express';
import { add } from 'lodash';
import { done } from '$helpers/response';

@CMS('/config')
export default class CMSConfigController {
  @Get('/')
  @RequirePermission([Permissions.CONFIG_MANAGEMENT])
  async getLis(req: Request) {
    const params = req.query;
    validate(listConfigSchema, params);
    return await service.getListConfig(params);
  }

  @Get('/:key')
  @RequirePermission([Permissions.CONFIG_MANAGEMENT])
  async getDetailConfig(req: Request, res: Response) {
    const key = req.params.key;
    if (!key) throw ErrorCode.Invalid_Input;
    return await service.getDetailConfig(key);
  }

  @Put('/:key')
  @RequirePermission([Permissions.CONFIG_MANAGEMENT])
  async updateConfig(req: Request, res: Response) {
    const body = req.body;
    validate(updateConfigSchema, body);
    const key = req.params.key;
    if (!key) throw ErrorCode.Invalid_Input;
    await service.updateConfig(key, body);
    return done(res);
  }
}
