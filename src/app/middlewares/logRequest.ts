import log from '$helpers/log';
import { Request, Response, NextFunction } from 'express';
const logger = log('Request');

export default function logRequest(req: Request, res: Response, next: NextFunction) {
  const method = req.method;
  const fullPath = req.originalUrl;
  const body = req.body || [];
  logger.info(`Method: ${method} | FullPath: ${fullPath} | Body: ${JSON.stringify(body)}`);
  next();
}
