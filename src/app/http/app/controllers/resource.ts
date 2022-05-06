import { Request } from 'express';
import { APP, Get, Post, Put } from '$helpers/decorator';
import { ErrorHandler } from '$helpers/response';
import { validate } from '$helpers/ajv';
import * as resource from '$app/services/resource';

@APP('/resource')
export default class APPUploadController {
  @Get('/all', [])
  async getAllResource(req: Request) {
    return await resource.getAllResource();
  }
}
