import log from '$helpers/log';
import { Request, Response, NextFunction } from 'express';
const logger = log('Middle ware check token');
import { ErrorHandler } from '$helpers/response';
import { verify } from 'jsonwebtoken';
import { getAdminInformation } from '$cms/services/auth';
import { promisify } from 'util';
import { ErrorCode, UserStatus } from '$enums/common';
import config from '$config';
const verifyAsync = promisify(verify) as any;

export function checkTokenCms(req: Request, res: Response, next: NextFunction) {
  let token = req.headers['authorization'] || '';
  token = token.replace('Bearer ', '');
  if (!token) {
    throw new ErrorHandler(ErrorCode.Token_Not_Exist);
  }

  verifyAsync(token, config.auth.CMSAccessTokenSecret)
    .then(async (decoded: any) => {
      try {
        const user = await getAdminInformation(decoded.id);
        if (user.status === UserStatus.INACTIVE || !user.status) {
          throw new ErrorHandler(ErrorCode.User_Blocked);
        }
        req.userId = decoded.id;
        req.permissions = decoded.permissions || [];
        next();
      } catch (error) {
        next(new ErrorHandler(error));
      }
    })
    .catch(() => {
      next(new ErrorHandler(ErrorCode.Token_Expired, 401));
    });
}

export function checkRefreshTokenCMS(req: Request, res: Response, next: NextFunction) {
  const refreshToken = req.body.refreshToken || '';
  if (!refreshToken) {
    logger.warn('Can not find the refresh token');
    throw new ErrorHandler(ErrorCode.Refresh_Token_Not_Exist);
  }

  verifyAsync(refreshToken, config.auth.CMSRefreshTokenSecret)
    .then(async (decoded: any) => {
      try {
        const user = await getAdminInformation(decoded.id);
        if (refreshToken !== user.refreshToken) throw new ErrorHandler(ErrorCode.Refresh_Token_Invalid, 401);

        if (user.refreshToken !== refreshToken) ErrorCode.Refresh_Token_Invalid;
        if (!user) throw new ErrorHandler(ErrorCode.Unknown_Error);
        if (user.status === UserStatus.INACTIVE || !user.status) throw new ErrorHandler(ErrorCode.User_Blocked);
        req.userId = decoded.id;
        next();
      } catch (error) {
        next(new ErrorHandler(error));
      }
    })
    .catch(() => {
      next(new ErrorHandler(ErrorCode.Refresh_Token_Invalid, 401));
    });
}

export function checkPermission(permissions: ReadonlyArray<number>) {
  return function (req: Request, res: Response, next: NextFunction) {
    const hasOwnPermission = permissions.every((permission) => req.permissions.includes(permission));
    if (!hasOwnPermission) {
      next(new ErrorHandler(ErrorCode.Access_Denied, 403, "You do not have permission to access this API."));
    }
    next();
  };
}
