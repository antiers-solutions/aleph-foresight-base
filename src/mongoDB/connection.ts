import mongoose from 'mongoose';
import { log } from '../utils/helper.utils';
import { CREATE_DB_CONN, BIND_CONN } from "../constants/mongoDB.constant";

// Database connection and events handler class
class DBConnectionHandler {
  static instance: DBConnectionHandler = null;

  static getInstance = () => {
    if (!DBConnectionHandler.instance) {
      DBConnectionHandler.instance = new DBConnectionHandler();
      delete DBConnectionHandler.constructor;
    }
    return DBConnectionHandler.instance;
  };

  /**
   * connect to the mongodb server
   * @returns boolean
   */
  createDBConnection = async () => {
    try {
      this._bindMongoConnectionEvents();
      await mongoose.connect(process.env.MONGO_CONNECTION_URI, {
        connectTimeoutMS: CREATE_DB_CONN.CONN_TIMEOUT
      });
      return true;
    } catch (err) {
      log.red(CREATE_DB_CONN.ERROR_CONN, err);
      return false;
    }
  };

  /**
   * release the database connection
   */
  releaseDBConnection = async () => {
    await mongoose.disconnect();
  };

  //***************** internal used methods *************************/

  /**
   * for binding the mongodb connection events
   */
  _bindMongoConnectionEvents = () => {
    try {
      // fired when connected to mongodb
      mongoose.connection.on('connecting', () => {
        log.blue(BIND_CONN.CONNECTING);
      });

      // fired when connected to mongodb
      mongoose.connection.on('connected', () => {
        log.green(BIND_CONN.CONNECTED);
      });

      // fired when mongodb connection is disconnected
      mongoose.connection.on('disconnected', () => {
        log.blue(BIND_CONN.DISCONNECTED);
      });

      //fired when error occur in mongodb connection
      mongoose.connection.on('error', (err: Error) => {
        log.red(BIND_CONN.ERROR, err);

        // for future usage
        // this.createDBConnection();
      });
    } catch (err) {
      log.red(BIND_CONN.ERROR_BIND, err);
    }
  };
}

const dbConnectionHandler = DBConnectionHandler.getInstance();
export default dbConnectionHandler;
