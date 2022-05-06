import mongoose from 'mongoose';
import log from '$helpers/log';
import config from '$config';

const logger = log('Index');
export default function createMongoConnection() {
  mongoose.connect(config.mongoDb.database, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    user: config.mongoDb.username,
    pass: config.mongoDb.password,
  });

  mongoose.connection.on('connected', function () {
    logger.info('Mongoose connected');
  });

  mongoose.connection.on('error', function (err) {
    logger.error('Cannot connect to mongodb');
    throw err;
  });

  mongoose.connection.on('disconnected', function () {
    logger.error('Mongoose disconnected');
  });
}
