import { ErrorHandler, ErrorHandlerController } from '$helpers/response';
import { NextFunction, Request, Response } from 'express';
import log from '$helpers/log';
import config from '$config';
import { ErrorCode } from '$enums/common';

export const handleError = (
  error: ErrorHandler | ErrorHandlerController,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode, errorCode, errorMessage, devMessage } = error;
  loggingError(req, error);
  const responseData = {
    success: false,
    errorCode,
    errorMessage,
    data: null,
  };
  if (config.environment !== 'production') responseData['devMessage'] = devMessage;
  return res.status(statusCode).send(responseData);
};

function loggingError(req: Request, error) {
  const method = req.method;
  const fullPath = req.originalUrl;
  const body = req.body || [];

  if (error.loggerJs) {
    let errorContent;
    if (error.errorCode && error.errorCode === ErrorCode.Invalid_Input) {
      errorContent = error.devMessage;
    }

    if (error.errorCode) {
      errorContent = error.errorMessage;
      if (error.devMessage) errorContent += '\nReason: ' + error.devMessage;
    } else errorContent = error.rawError;

    error.loggerJs.error(errorContent);
  } else {
    log('INFO').error(error);
  }

  log('INFO').error(`Method: ${method} | FullPath: ${fullPath} | Body: ${JSON.stringify(body)}\n`);
}
