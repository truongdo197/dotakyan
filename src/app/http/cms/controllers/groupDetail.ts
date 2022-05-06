import { listGroupSchema, updateStatusGroupSchema } from '$cms/validators/groupDetail';
import { ErrorCode, Permissions } from '$enums/common';
import { validate } from '$helpers/ajv';
import { CMS, Get, Put, RequirePermission } from '$helpers/decorator';
import { handleInputPaging } from '$helpers/utils';
import * as service from '$cms/services/groupDetail';
import { Request, Response } from 'express';

@CMS('/group')
export default class CMSGroupController {
  @Get('/')
  @RequirePermission([Permissions.GROUP_MANAGEMENT])
  async getListGroup(req: Request) {
    const params = handleInputPaging(req.query);
    validate(listGroupSchema, params);
    return await service.getListGroup(params);
  }

  @Put('/update-status/:id')
  @RequirePermission([Permissions.GROUP_MANAGEMENT])
  async updateStatusGroup(req: Request, res: Response) {
    const body = req.body;
    validate(updateStatusGroupSchema, body);
    const groupId = Number(req.params.id);
    if (!groupId) throw ErrorCode.Invalid_Input;
    await service.updateStatusGroup(groupId, body);
    return;
  }

  @Get('/detail/:id')
  @RequirePermission([Permissions.GROUP_MANAGEMENT])
  async getDetailGroup(req: Request) {
    const groupId = Number(req.params.id);
    if (!groupId) throw ErrorCode.Invalid_Input;
    return await service.getDetailGroup(groupId);
  }
}
