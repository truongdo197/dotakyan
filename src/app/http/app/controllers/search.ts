import { Request } from 'express';
import { APP, Get, Post, Put } from '$helpers/decorator';
import { validate } from '$helpers/ajv';
import { handleInputPaging } from '$helpers/utils';
import * as search from '$app/services/search';
import { searchGroupSchema, searchMapSchema, searchMemberSchema } from '$app/validators/search';

@APP('/search')
export default class APPUploadController {
  @Post('/map')
  async searchMap(req: Request) {
    req.body.lat = req.body.lat || Number(req.body.lat);
    req.body.lat = req.body.lat || Number(req.body.lng);
    const body = handleInputPaging(req.body);
    validate(searchMapSchema, body);
    const memberId = req.memberId;
    const result = await search.searchMap(memberId, body);
    return result;
  }

  @Post('/member')
  async searchMember(req: Request) {
    req.body.lat = req.body.lat || Number(req.body.lat);
    req.body.lat = req.body.lat || Number(req.body.lng);
    const body = handleInputPaging(req.body);
    const memberId = req.memberId;
    validate(searchMemberSchema, body);
    const result = await search.searchMember(memberId, body);
    return result;
  }

  @Post('/group')
  async searchGroup(req: Request) {
    req.body.lat = req.body.lat || Number(req.body.lat);
    req.body.lat = req.body.lat || Number(req.body.lng);
    const body = handleInputPaging(req.body);
    const memberId = req.memberId;
    validate(searchGroupSchema, body);
    const result = await search.searchGroup(memberId, body);
    return result;
  }
}
