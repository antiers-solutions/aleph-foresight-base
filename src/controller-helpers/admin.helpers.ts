import { Response } from "express";
import { 
  ecrecover,
  fromRpcSig,
  keccak256,
  bufferToHex,
  pubToAddress, 
} from "ethereumjs-util";
import { v4 as uuidv4 } from "uuid";
import { STATUS_CODES, RESPONSE_MESSAGES, DATA_MODELS } from "../constants/";
const { getPaginationParams, getAdminAddress, RESPONSE } = require("./common.helpers");
import mongoDataHelper from "../helpers/mongo.data.helper";
import redisHelper from "../helpers/redis.helper";
import { ADMIN_LOGIN, REDIS_EX_TIME } from "../constants/admin.constant";
import { ApiResponse } from "interfaces/user.helpers.interface";
class AdminHelper {
  public getUser = async (
    res: Response,
    payload: {
      page: number;
      limit: number;
    }
  ) => {
    try {
      const { page, limit } = payload;
      const { skip, limitValue } = getPaginationParams(page, limit);
      const users = await mongoDataHelper.findAllUserAdmin(
        DATA_MODELS.User,
        {},
        { createdAt: -1 },
        skip,
        limitValue
      );
      if (users) {
        return {
          error: false,
          data: users,
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS,
        };
      } else {
        return RESPONSE.USER_NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  public getEventsCreators = async (
    res: Response,
    payload: {
      page: number;
      limit: number;
    }
  ) => {
    try {
      const { page, limit } = payload;
      const { skip, limitValue } = getPaginationParams(page, limit);
      const users = await mongoDataHelper.findAllAdminEventCreators(
        DATA_MODELS.User,
        {},
        { createdAt: -1 },
        skip,
        limitValue
      );
      if (users) {
        return {
          error: false,
          data: users,
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS,
        };
      } else {
        return RESPONSE.USER_NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * User Details handel in helper function
   * @returns
   */
  public getClosedPosition = async (
    res: Response,
    payload: {
      page: number;
      limit: number;
      status?: number;
      filter?: string;
      token: string;
    }
  ) => {
    try {
      const { page, limit, status, filter, token } = payload;
      const { skip, limitValue } = getPaginationParams(page, limit);
      let query: any = {};
      const value = await redisHelper.client.get(token);
      switch (filter) {
        case "admin":
          query.userId = JSON.parse(value).signerAddress.toLocaleLowerCase();
          break;
        case "user":
          query.userId = {
            $ne: JSON.parse(value).signerAddress.toLocaleLowerCase(),
          };
          break;
        case "all":
          query = {};
          break;
      }
      const ordersData = await mongoDataHelper.findAllClosedPositionAdmin(
        DATA_MODELS.Events,
        query,
        status,
        { createdAt: -1 },
        skip,
        limitValue
      );
      if (ordersData) {
        return {
          error: false,
          data: ordersData,
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS,
        };
      } else {
        return RESPONSE.USER_NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };

  public adminLogin = async (
    res: Response,
    payload: {
      wallet_address: string;
      signature_key: string;
    },
    userAgent: string
  ): Promise<ApiResponse> => {
    try {
      const adminAddress = await getAdminAddress();
      const verifyPersonalSign = (
        message: string,
        signature: string,
        publicKey: string
      ) => {
        const msgBuffer = Buffer.from(message);
        const prefix = Buffer.from(
          "\x19Ethereum Signed Message:\n" + msgBuffer.length,
          "utf-8"
        );
        const msgHash = keccak256(Buffer.concat([prefix, msgBuffer]));
        const signatureParams = fromRpcSig(signature);
        const publicKeyBuffer = ecrecover(
          msgHash,
          signatureParams.v,
          signatureParams.r,
          signatureParams.s
        );
        const addressBuffer = pubToAddress(publicKeyBuffer);
        const address = bufferToHex(addressBuffer);
        return {
          isAddress: address.toLocaleLowerCase() === publicKey.toLocaleLowerCase(),
          address,
        };
      };

      const message = payload?.wallet_address;
      const signature = payload?.signature_key;
      const signerAddress = payload?.wallet_address;
      const signatureVerified = verifyPersonalSign(
        message,
        signature,
        signerAddress
      );
      if (
        signatureVerified?.isAddress &&
        adminAddress.toLocaleLowerCase() ==
          signatureVerified?.address.toLocaleLowerCase()
      ) {
        const token = uuidv4();
        const role = ADMIN_LOGIN.ROLE;
        const setData = {
          signerAddress,
          role,
          userAgent: userAgent,
        };
        await redisHelper.client.set(token, JSON.stringify(setData), {
          EX: REDIS_EX_TIME.EXPIRE,
        });
        await redisHelper.client.get(token);
        const admin = await mongoDataHelper.findOne(DATA_MODELS.User, {
          walletAddress: signatureVerified?.address.toLocaleLowerCase(),
        });
        if (!admin) {
          await mongoDataHelper.saveData(DATA_MODELS.User, {
            ensId: null,
            fullUserName: null,
            userName: null,
            walletAddress: payload?.wallet_address.toLocaleLowerCase(),
            email: null,
            role: role,
            status: true,
            password: null,
            profilePicture: null,
          });
        }
        return {
          token,
          data: {
            walletAddress: payload?.wallet_address.toLocaleLowerCase(),
          },
          error: false,
          status: 200,
          message: RESPONSE_MESSAGES.LOGIN,
        };
      } else {
        return {
          error: true,
          data: { isLogin: false },
          status: STATUS_CODES.UNAUTHORIZED,
          message: RESPONSE_MESSAGES.ADMINNOTFOUND,
        };
      }
    } catch (error) {
      return {
        error: true,
        data: { isLogin: false },
        status: STATUS_CODES.INTERNALSERVER,
        message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR,
      };
    }
  };
  public getTotalTransaction = async () => {
    try {
      const eventTransactions = await mongoDataHelper.getCount(
        DATA_MODELS.Events,
        {}
      );
      const orderTransactions = await mongoDataHelper.getCount(
        DATA_MODELS.Order,
        {}
      );
      if (orderTransactions==null && eventTransactions==null){
        return RESPONSE.DATA_NOT_FOUND;
      }
      const transactionData = eventTransactions + orderTransactions;
      if (transactionData) {
        return {
          error: false,
          data: { transactionData },
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS,
        };
      } else {
        return RESPONSE.USER_NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  }; 
  /**
   * User Details handel in helper function
   * @returns
   */
  public getTotalEvents = async () => {
    try {
      const eventsData = await mongoDataHelper.findAll(DATA_MODELS.Events, {});
      const activeEventsData = await mongoDataHelper.findAll(
        DATA_MODELS.Events,
        { status: 1 }
      );
      if (eventsData==null && activeEventsData==null){
        return RESPONSE.DATA_NOT_FOUND;
      }
      const total = eventsData.length;
      const totalActiveEvent = activeEventsData.length;
      if (total) {
        return {
          error: false,
          data: { totalEvents: total, totalActiveEvent },
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_EVENTSDATA_SUCCESS,
        };
      } else {
        return RESPONSE.USER_NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };

  public getTotalDispute = async () => {
    try {
      const total = await mongoDataHelper.getCount(DATA_MODELS.Dispute, {});
      if (total) {
        return {
          error: false,
          data: {total },
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS,
        };
      } else {
        return RESPONSE.USER_NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * User Details handel in helper function
   * @returns
   */
  public getDisputeRaise = async (
    res: Response,
    payload: {
      page: number;
      limit: number;
    }
  ) => {
    try {
      const { page, limit } = payload;
      const { skip, limitValue } = getPaginationParams(page, limit);
      const disputeData = await mongoDataHelper.findAllDispute(
        DATA_MODELS.Dispute,
        { createdAt: -1 },
        skip,
        limitValue
      );
      if (disputeData) {
        return {
          error: false,
          data: disputeData,
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS,
        };
      } else {
        return RESPONSE.USER_NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
}
export default new AdminHelper();
