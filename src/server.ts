import * as config from './config';
const isLoaded = config.loadEnvs();
import App from './app';
import UserController from './controllers/user.controller';
import ContractController from './controllers/contrcat.controller';
import dbConnectionHandler from './mongoDB/connection';
import redisHelper from './helpers/redis.helper';
import { log } from './utils/helper.utils';
import CurrencyController from './controllers/currency.controller';
import DisputeController from './controllers/dispute.controller';
import AdminController from './controllers/admin.controller';
import ERR from '../src/constants/server.constant'

// start the service
(async () => {
  try {
    if (isLoaded) {
      const app = new App([
        new UserController(), new ContractController(), new CurrencyController(),new DisputeController(), new AdminController
      ]);
      // connect to the mongodb server
      const isDBconnected = await dbConnectionHandler.createDBConnection();
      if (!isDBconnected) throw new Error(ERR.MONGO_CONN);

      // connect to the redis server
      const isRedisConnected = await redisHelper.connectRedis();
      if (!isRedisConnected) throw new Error(ERR.REDIS_CONN);
      // bind the port and listen for requests
     app.listen();
    } else throw new Error(ERR.ENV_NOT_LOADED);
  } catch (err) {
    log.red(ERR.SERVICE, err.message);
  }
})();
