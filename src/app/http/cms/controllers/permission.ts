import { ErrorCode, Permissions } from '$enums/common';
import { validate } from '$helpers/ajv';
import { CMS, Delete, Get, Post, Put, RequirePermission } from '$helpers/decorator';
import { NextFunction, Request, Response } from 'express';
import * as service from '$cms/services/permission';
import { addRoleSchema, updateRolePermissionsSchema, updateRoleSchema } from '$cms/validators/permission';

@CMS('/permission')
export default class CMSPermissionController {
  @Get('/')
  @RequirePermission([Permissions.PERMISSION_MANAGEMENT])
  async getListPermissions(req: Request, res: Response, next: NextFunction) {
    const permissions = await service.getListPermissions();
    return permissions;
  }

  // Role
  @Get('/role')
  @RequirePermission([Permissions.PERMISSION_MANAGEMENT])
  async getListRoles(req: Request, res: Response, next: NextFunction) {
    const roles = await service.getListRole();
    return roles;
  }

  @Post('/role')
  @RequirePermission([Permissions.PERMISSION_MANAGEMENT])
  async addRole(req: Request, res: Response, next: NextFunction) {
    const body = req.body;
    validate(addRoleSchema, body);
    await service.addRole(body.roleName);
    return;
  }

  @Put('/role/:roleId')
  @RequirePermission([Permissions.PERMISSION_MANAGEMENT])
  async updateRole(req: Request, res: Response, next: NextFunction) {
    const body = req.body;
    const roleId = Number(req.params.roleId);
    if (!roleId) throw ErrorCode.Invalid_Input;
    validate(updateRoleSchema, body);
    await service.updateRole(roleId, body.roleName);
    return;
  }

  @Put('/hidden-role/:roleId')
  @RequirePermission([Permissions.PERMISSION_MANAGEMENT])
  async hiddenRole(req: Request, res: Response, next: NextFunction) {
    const roleId = Number(req.params.roleId);
    if (!roleId) throw ErrorCode.Invalid_Input;
    await service.hiddenRole(roleId);
    return;
  }

  @Put('/rolePermission/:roleId')
  @RequirePermission([Permissions.PERMISSION_MANAGEMENT])
  async updateRolePermissions(req: Request, res: Response, next: NextFunction) {
    const { permissions, changeUserPermission } = req.body;
    const roleId = Number(req.params.roleId);
    validate(updateRolePermissionsSchema, req.body);
    await service.updateRolePermissions(roleId, permissions, changeUserPermission);
    return;
  }

  @Get('/rolePermission/:roleId')
  @RequirePermission([Permissions.PERMISSION_MANAGEMENT])
  async getRolePermissions(req: Request, res: Response, next: NextFunction) {
    const roleId = Number(req.params.roleId);
    const permissions = await service.getRolePermissions(roleId);
    return permissions;
  }

  // User
  @Get('/user/:userId')
  @RequirePermission([Permissions.PERMISSION_MANAGEMENT])
  async getUserPermissions(req: Request, res: Response, next: NextFunction) {
    const userId = Number(req.params.userId);
    const permissions = await service.getUserPermissions(userId);
    return permissions;
  }

  @Put('/user/:userId')
  @RequirePermission([Permissions.PERMISSION_MANAGEMENT])
  async updateUserPermissions(req: Request, res: Response, next: NextFunction) {
    const userId = Number(req.params.userId);
    const body = req.body;
    await service.updateUserPermissions(userId, body.permissions);
    return;
  }
}
