import {
  addResourceSchema,
  listResourceSchema,
  updateResourceSchema,
  updateStatusResourceSchema,
} from '$cms/validators/resource';
import { Permissions } from '$enums/common';
import { validate } from '$helpers/ajv';
import { CMS, Get, Post, Put, RequirePermission } from '$helpers/decorator';
import { handleInputPaging } from '$helpers/utils';
import * as service from '$cms/services/resource';
import { Request, Response } from 'express';
import { add } from 'lodash';
import { done } from '$helpers/response';

@CMS('/resource')
export default class CMSResourceController {
  @Get('/')
  @RequirePermission([Permissions.RESOURCE_MANAGEMENT])
  async getLisResoruce(req: Request) {
    const params = handleInputPaging(req.query);
    validate(listResourceSchema, params);
    return await service.getListResource(params);
  }

  @Post('/')
  @RequirePermission([Permissions.RESOURCE_MANAGEMENT])
  async createResrouce(req: Request, res: Response) {
    const body = req.body;
    const userId = req.userId;
    validate(addResourceSchema, body);
    await service.createResource(userId, body);
    return done(res);
  }

  @Get('/:resourceId')
  @RequirePermission([Permissions.RESOURCE_MANAGEMENT])
  async getDetailResource(req: Request, res: Response) {
    const resourceId = Number(req.params.resourceId);
    return await service.getDetailResource(resourceId);
  }

  @Put('/:resourceId')
  @RequirePermission([Permissions.RESOURCE_MANAGEMENT])
  async updateresource(req: Request, res: Response) {
    const body = req.body;
    validate(updateResourceSchema, body);
    const resourceId = Number(req.params.resourceId);
    await service.updateResource(resourceId, body);
    return done(res);
  }

  @Put('/update-status/:resourceId')
  @RequirePermission([Permissions.RESOURCE_MANAGEMENT])
  async updateStatusResource(req: Request, res: Response) {
    const body = req.body;
    validate(updateStatusResourceSchema, body);
    const resourceId = Number(req.params.resourceId);
    await service.updateStatusResource(resourceId, body);
    return done(res);
  }
}
