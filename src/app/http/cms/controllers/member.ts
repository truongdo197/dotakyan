import { CMS, Delete, Get, Post, Put, RequirePermission } from '$helpers/decorator';
import { checkRefreshTokenCMS } from '$middlewares/cms';
import { validate } from '$helpers/ajv';
import { Request, Response } from 'express';
import { handleInputPaging } from '$helpers/utils';
import * as service from '$cms/services/member';
import { done } from '$helpers/response';
import { ErrorCode, Permissions } from '$enums/common';
import { listMemberSchema, updateStatusSchema } from '$cms/validators/member';

@CMS('/member')
export default class CMSMemberController {
  @Get('/')
  @RequirePermission([Permissions.MEMBER_MANAGEMENT])
  async getListMember(req: Request) {
    const params = handleInputPaging(req.query);
    validate(listMemberSchema, params);
    return await service.getListMember(params);
  }

  @Get('/:memberId')
  @RequirePermission([Permissions.MEMBER_MANAGEMENT])
  async getDetailMember(req: Request) {
    const id = Number(req.params.memberId);
    if (!id) throw ErrorCode.User_Not_Exist;
    return await service.getDetailMember(id);
  }

  @Put('/:memberId')
  @RequirePermission([Permissions.MEMBER_MANAGEMENT])
  async updateStatusMember(req: Request, res: Response) {
    const id = Number(req.params.memberId);
    validate(updateStatusSchema, req.body);
    const status = Number(req.body.status);
    await service.updateStatusMember(id, status);
  }
}
