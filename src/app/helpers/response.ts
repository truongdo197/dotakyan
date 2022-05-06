import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '$enums/common';
import log from '$helpers/log';
import { Logger } from 'log4js';
const logger = log('Error handle');

export class ErrorHandler extends Error {
  public errorCode: number;
  public statusCode: number;
  public errorMessage: string;
  public devMessage: string;
  constructor(error: Error | ErrorHandler | number, statusCode?: number, devMessage: any = '') {
    super();
    if (error.hasOwnProperty('errorCode')) {
      this.errorCode = error['errorCode'];
      this.statusCode = error['statusCode'] || 400;
      this.errorMessage = ErrorCode[this.errorCode];
      this.devMessage = devMessage || error['devMessage'] || '';
    } else {
      this.errorCode = typeof error === 'number' ? error : Number(error.message) | 0;
      this.statusCode = statusCode || 400;
      this.errorMessage = ErrorCode[this.errorCode];
      this.devMessage = devMessage;
    }
  }
}

export class ErrorHandlerController extends Error {
  public errorCode: number;
  public statusCode: number;
  public errorMessage: string;
  public logger: Logger;
  public devMessage: string;
  public loggerJs: any;
  public rawError: any;
  constructor(error: Error | ErrorHandler, logger: Logger, statusCode?: number) {
    super();
    this.loggerJs = logger;

    if (error.hasOwnProperty('errorCode')) {
      this.errorCode = error['errorCode'];
      this.statusCode = error['statusCode'] || 400;
    } else {
      this.errorCode = typeof error === 'number' ? error : Number(error.message) | 0;
      this.statusCode = statusCode || 400;
    }

    this.errorMessage = ErrorCode[this.errorCode];
    this.devMessage = error['devMessage'];
    this.rawError = error;
  }
}

export const done = (res: Response, data: any = null, statusCode: number = 200) => {
  if (data && data.paging === true) {
    return res.status(statusCode).send({
      success: true,
      totalPages: data.totalPages,
      pageIndex: data.pageIndex,
      totalItems: data.totalItems,
      hasMore: data.hasMore,
      data: data.data,
    });
  }
  res.status(statusCode).send({ success: true, data });
  return { isDone: true };
};

// /**Abort function and throw exception */
// export function abort(errorCode: ErrorCode | ErrorHandler) {
//   throw errorCode;
// }
