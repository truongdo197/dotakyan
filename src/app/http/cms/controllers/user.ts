import { CMS, Delete, Get, Post, Put, RequirePermission } from '$helpers/decorator';
import { validate } from '$helpers/ajv';
import { Request, Response } from 'express';
import { handleInputPaging } from '$helpers/utils';
import { ErrorCode, Permissions } from '$enums/common';
import * as service from '$cms/services/user';
import { listUserSchema, updateSchema } from '$cms/validators/user';
import { updateStatusSchema, updatePasswordSchema, createUserSchema } from '$cms/validators/user';
import { done, ErrorHandler } from '$helpers/response';

@CMS('/user')
export default class CMSUserController {
  @Get('/')
  @RequirePermission([Permissions.USER_MANAGEMENT])
  async getListUser(req: Request) {
    const params = handleInputPaging(req.query);
    validate(listUserSchema, params);
    return await service.getListUser(params);
  }

  @Post('/')
  @RequirePermission([Permissions.USER_MANAGEMENT])
  async createUser(req: Request) {
    const body = req.body;
    validate(createUserSchema, req.body);
    await service.createUser(body);
    return;
  }

  @Get('/:userId')
  @RequirePermission([Permissions.USER_MANAGEMENT])
  async getDetailUser(req: Request) {
    const id = Number(req.params.userId);
    if (!id) throw new ErrorHandler(ErrorCode.Invalid_Input, 422, 'Missing id in query params');
    return await service.getDetailUser(id);
  }

  @Put('/:userId')
  @RequirePermission([Permissions.USER_MANAGEMENT])
  async updateUser(req: Request, res: Response) {
    const body = req.body;
    const id = Number(req.params.userId);
    if (!id) throw new ErrorHandler(ErrorCode.Invalid_Input, 422, 'Missing id in query params');
    validate(updateSchema, req.body);
    await service.updateUser(id, body);
    return;
  }

  @Put('/update-status/:userId')
  @RequirePermission([Permissions.USER_MANAGEMENT])
  async updateStatusUser(req: Request, res: Response) {
    const id = Number(req.params.userId);
    if (!id) throw new ErrorHandler(ErrorCode.Invalid_Input, 422, 'Missing id in query params');
    validate(updateStatusSchema, req.body);
    const status = Number(req.body.status);
    await service.updateStatusUser(id, status);
    return;
  }

  @Put('/update-password/:userId')
  @RequirePermission([Permissions.USER_MANAGEMENT])
  async updatePasswordUser(req: Request, res: Response) {
    const id = Number(req.params.userId);
    const body = req.body;
    if (!id) throw new ErrorHandler(ErrorCode.Invalid_Input, 422, 'Missing id in query params');
    validate(updatePasswordSchema, body);
    await service.updatePasswordUser(id, body);
    return;
  }
}
