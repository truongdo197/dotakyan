import { Request } from 'express';
import { APP, Get, Post, Put } from '$helpers/decorator';
import { ErrorHandler } from '$helpers/response';
import { validate } from '$helpers/ajv';
import * as conversation from '$app/services/conversation';
import { CommonStatus, ErrorCode, MemberType, MessageType } from '$enums/common';
import { createGroupChatSchema, sendImageMessageSchema, sendMessageSchema } from '$app/validators/chat';
import { handleInputPaging, lastMessage } from '$helpers/utils';
import { updateProfileAuthentication } from '$middlewares/app';
import { putImageToS3 } from '$helpers/s3Upload';
import multer from 'multer';
import md5 from 'md5';
var upload = multer();

@APP('/upload')
export default class APPUploadController {
  @Post('/', [updateProfileAuthentication, upload.array('files', 3)])
  async uploadImages(req: Request) {
    let results = [];
    const files = req.files as Array<Express.Multer.File>;

    for (let file of files) {
      let arr_ext = (file.originalname || '').split('.');
      let md5Name =
        arr_ext.length > 0 ? `${md5(file.originalname)}.${arr_ext[arr_ext.length - 1]}` : md5(file.originalname);
      const fileName = `${Date.now().toString()}-${md5Name}`;

      await putImageToS3(file, fileName);
      results.push(fileName);
    }

    return results;
  }
}
