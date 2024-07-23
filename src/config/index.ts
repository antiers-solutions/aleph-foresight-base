import { config } from 'dotenv';
import { resolve } from 'path';
import { log } from '../utils/helper.utils';

/**
 * load the env for different enviroment
 * @returns
 */
export const loadEnvs = () => {
  try {
    const enviroment = process.env.NODE_ENV;
    if (enviroment === 'local' || enviroment === 'dev') {
      log.blue('#Development Mode');
      load('local.env');
    } else if (enviroment === 'stage') {
      log.green('#Staging Mode');
      load('stage.env');
    } else if (enviroment === 'prod') {
      log.green('#Production Mode');
      load('prod.env');
    } else if (enviroment === 'qa') {
      log.green('#QA Mode');
      load('qa.env');
    } else if (enviroment === 'test') {
      log.green('#Testing Mode');
      load('test.env');
    } else {
      // if no NODE_ENV is set then by default load data from local.env file
      load('local.env');
    }
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * load the data from env file
 * @param path (load data from following file)
 */
const load = (fileName: string) => {
  config({ path: resolve(__dirname, `./${fileName}`) });
};
