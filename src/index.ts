require('dotenv').config();
import 'reflect-metadata';
import 'module-alias/register';
import '$helpers/notification';
import '$http';
import { RootRoute } from '$helpers/decorator';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import { createConnection } from 'typeorm';
import { createServer } from 'http';
import logRequest from '$middlewares/logRequest';
import log from '$helpers/log';
import { handleError } from '$middlewares/handleError';
import config from '$config';
import createMongoConnection from './mongo';
import rateLimit from 'express-rate-limit';
import initSocket from '$http/modules/socket';
import Message from '$mongo/Message';

const limiter = rateLimit({
  windowMs: 60 * 1000, //1p
  max: 300, // 300 req/1p
  message: `{
    "success": false,
    "errorCode": -1,
    "errorMessage": "Maximum_Request",
    "data": null
}`,
});

const logger = log('Index');
const app = express();
const http = createServer(app);

createConnection()
  .then(async () => {
    createMongoConnection();
    initSocket(http);

    app.use(cors());
    app.use(helmet());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(limiter);
    app.use(logRequest);
    app.use(RootRoute);
    app.use(handleError);

    http.listen(config.serverPort, () => {
      logger.info(`Express server started on port "${config.serverPort}". Environment "${config.environment}"`);
    });
  })
  .catch((error) => logger.error(error));
