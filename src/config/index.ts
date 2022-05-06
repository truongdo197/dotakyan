export default {
  domain: process.env.DOMAIN,
  environment: process.env.ENVIRONMENT,
  /** Default 3000 */
  serverPort: process.env.SERVER_PORT,
  /**Default is 10 days */
  cacheExpire: Number(process.env.CACHE_EXPIRE) || 864000000, // 10 Days
  /**Distance for search home, default  010 kilometers */
  distanceSearch: Number(process.env.DISTANCE_SEARCH) || 10, // Kilometer
  /** Mysql database information */
  database: {
    hostname: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    databaseName: process.env.DB_NAME,
  },
  /** Authentication information*/
  auth: {
    AccessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    RefreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    CMSAccessTokenSecret: process.env.CMS_ACCESS_TOKEN_SECRET,
    CMSRefreshTokenSecret: process.env.CMS_REFRESH_TOKEN_SECRET,
    SaltRounds: Number(process.env.SALT_ROUNDS),
    AccessTokenExpire: Number(process.env.ACCESS_TOKEN_EXPIRE),
    RefreshTokenExpire: Number(process.env.REFRESH_TOKEN_EXPIRE),
    VerificationCodeExpire: Number(process.env.VERIFICATION_CODE_EXPIRE),
  },
  mongoDb: {
    database: process.env.MONGO_DB,
    username: process.env.MONGO_USER,
    password: process.env.MONGO_PASS,
  },
  AWSUpload: {
    domain: process.env.AWS_UPLOAD_DOMAIN,
    // downloadUrlThumb: process.env.AWS_DOWNLOAD_URL_THUMB,
    /** URL download image */
    downloadUrl: process.env.AWS_DOWNLOAD_URL,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_SECRET_ACCESS_ID,
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET,
    /** List thumb '' is origin image */
    thumbs: ['', ...process.env.AWS_THUMBS.split(' ')],
  },
  oneSignal: {
    appId: process.env.ONE_SIGNAL_APP_ID,
    restKey: process.env.ONE_SIGNAL_REST_API_KEY,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
  twilio: {
    sid: process.env.TWILIO_SID,
    token: process.env.TWILIO_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
};
