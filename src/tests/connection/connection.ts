import redisHelper from '../../helpers/redis.helper';
import dbConnectionHandler from '../../mongoDB/connection';

export const connect = async () => {
  redisHelper.connectRedis();
  await dbConnectionHandler.createDBConnection();
  return true;
};

export const disconnect = async () => {
  await redisHelper.releaseRedisConnection();
  await dbConnectionHandler.releaseDBConnection();
  return true;
};
