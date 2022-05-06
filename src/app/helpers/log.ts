import { configure, getLogger, Logger } from 'log4js';

configure({
  appenders: {
    console: {
      type: 'console',
    },
    errorFile: {
      type: 'dateFile',
      filename: 'logs/error.log',
      keepFileExt: true,
    },
    errors: {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: 'errorFile',
    },
  },
  categories: {
    default: { appenders: ['console', 'errors'], level: 'debug' },
  },
});

export default function log(service): Logger {
  const logger = getLogger(service);
  return logger;
}
