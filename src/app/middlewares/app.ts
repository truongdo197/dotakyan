import { Request, Response, NextFunction } from 'express';
import { getMemberInformationById } from '$app/services/auth';
import log from '$helpers/log';
const logger = log('Middle ware check token');
import { ErrorHandler } from '$helpers/response';
import { verify } from 'jsonwebtoken';
import { promisify } from 'util';
import { ErrorCode, MemberStatus } from '$enums/common';
import config from '$config';
const verifyAsync = promisify(verify) as any;

/**Public data in the token */
interface IDecodeToken {
  id: number;
  status: MemberStatus;
}

export function checkTokenApp(req: Request, res: Response, next: NextFunction) {
  let token = req.headers['authorization'] || '';
  token = token.replace('Bearer ', '');
  if (!token) {
    throw new ErrorHandler(ErrorCode.Token_Not_Exist);
  }

  verifyAsync(token, config.auth.AccessTokenSecret)
    .then(async (decoded: IDecodeToken) => {
      try {
        const member = await getMemberInformationById(decoded.id);

        /** When member uncompleted profile */
        if (member.status === MemberStatus.DEFAULT) {
          throw new ErrorHandler(ErrorCode.Permission_Denied, 400, 'The profile of member is not completed.');
        }

        /** When subscription expire */
        if (new Date(member.subscriptionExpireAt).getTime() < new Date().getTime()) {
          throw new ErrorHandler(
            ErrorCode.Subscription_Expire,
            400,
            'The subscription of this member expired. Buy subscription to continue.'
          );
        }

        if (member.status === MemberStatus.INACTIVE || !member.status) {
          throw new ErrorHandler(ErrorCode.Member_Blocked, 400, 'Admin blocked this member');
        }

        req.memberId = decoded.id;
        req.name = member.name;
        next();
      } catch (error) {
        next(new ErrorHandler(error));
      }
    })
    .catch(() => {
      next(new ErrorHandler(ErrorCode.Token_Expired, 401, 'Access token invalid.'));
    });
}

/**
 * Use other middle authentication for some API in member routes.
 * This middleware accept for member status = 3(not update profile completely)
 */
export function updateProfileAuthentication(req: Request, res: Response, next: NextFunction) {
  let token = req.headers['authorization'] || '';
  token = token.replace('Bearer ', '');
  if (!token) {
    throw new ErrorHandler(ErrorCode.Token_Not_Exist);
  }

  verifyAsync(token, config.auth.AccessTokenSecret)
    .then(async (decoded: IDecodeToken) => {
      try {
        const member = await getMemberInformationById(decoded.id);

        /**When member uncompleted profile */
        if (member.status === MemberStatus.INACTIVE || !member.status) {
          throw new ErrorHandler(ErrorCode.Member_Blocked);
        }

        req.memberId = decoded.id;
        req.name = member.name;
        next();
      } catch (error) {
        next(new ErrorHandler(error));
      }
    })
    .catch(() => {
      next(new ErrorHandler(ErrorCode.Token_Expired, 401));
    });
}

export function checkRefreshToken(req: Request, res: Response, next: NextFunction) {
  const refreshToken = req.body.refreshToken || '';
  if (!refreshToken) {
    logger.warn('Can not find the refresh token');
    throw new ErrorHandler(ErrorCode.Refresh_Token_Not_Exist);
  }

  verifyAsync(refreshToken, config.auth.RefreshTokenSecret)
    .then(async (decoded: IDecodeToken) => {
      try {
        const member = await getMemberInformationById(decoded.id);
        if (refreshToken !== member.refreshToken) throw new ErrorHandler(ErrorCode.Refresh_Token_Invalid, 401);
        if (!member) throw new ErrorHandler(ErrorCode.Unknown_Error);
        if (member.status === MemberStatus.INACTIVE || !member.status) throw new ErrorHandler(ErrorCode.User_Blocked);
        req.memberId = decoded.id;
        next();
      } catch (error) {
        next(new ErrorHandler(error));
      }
    })
    .catch(() => {
      next(new ErrorHandler(ErrorCode.Refresh_Token_Invalid, 401));
    });
}
