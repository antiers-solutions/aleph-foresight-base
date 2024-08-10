import { Response } from "express";
import {
  ecrecover,
  fromRpcSig,
  keccak256,
  bufferToHex,
  pubToAddress
} from "ethereumjs-util";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "interfaces/user.helpers.interface";
const {
  getPaginationParams,
  getAdminAddress,
  RESPONSE
} = require("./common.helpers");
import mongoDataHelper from "../helpers/mongo.data.helper";
import redisHelper from "../helpers/redis.helper";
import {
  STATUS_CODES,
  RESPONSE_MESSAGES,
  DATA_MODELS,
  ADMIN
} from "../constants/";
import { REDIS_EX_TIME } from "../constants/admin.constant";

class AdminHelper {
  /**
   * helper function to get the list of all the users
   * @param res
   * @param payload
   * @returns
   */

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
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get all the event creators
   * @param res
   * @param payload
   * @returns
   */
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
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get the list of all the closed events
   * @param res
   * @param payload
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
      // get the token from redis
      const value = await redisHelper.client.get(token);
      switch (filter) {
        case "admin":
          query.userId = JSON.parse(value).signerAddress.toLocaleLowerCase(); // wallet address from token
          break;
        case "user":
          query.userId = {
            $ne: JSON.parse(value).signerAddress.toLocaleLowerCase()
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
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get total number of event creators on platform
   * @returns 
   */
  public getTotalEventCreators = async (
  ) => {
    try {
      const totalCreators = await mongoDataHelper.findTotalEventCreators(
        DATA_MODELS.Events,
      );
      if (totalCreators) {
        return {
          error: false,
          data: { totalCreators:totalCreators } ,
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS,
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * The admin sign-in helper handles login operation and check if the user is admin or not
   * @param req
   * @param res
   * @param payload
   * @param userAgent
   * @returns
   */
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
      // Function to verify the signature
      const verifyPersonalSign = (
        message: string,
        signature: string,
        publicKey: string
      ) => {
        // This line creates a buffer from the message string passed into the function. Buffers are Node.js' way of handling binary data.
        const msgBuffer = Buffer.from(message);
        //This line creates a prefix as required by Ethereum's message signing standard (EIP-191). It's a string that specifies the type of message and its length
        const prefix = Buffer.from(
          "\x19Ethereum Signed Message:\n" + msgBuffer.length,
          "utf-8"
        );
        //This line calculates the Keccak-256 hash (also known as SHA-3) of the concatenated prefix and message buffer.
        const msgHash = keccak256(Buffer.concat([prefix, msgBuffer]));
        // Parse the signature
        const signatureParams = fromRpcSig(signature);
        const publicKeyBuffer = ecrecover(
          msgHash,
          signatureParams.v,
          signatureParams.r,
          signatureParams.s
        );
        // Derive the Ethereum address from the public key buffer
        const addressBuffer = pubToAddress(publicKeyBuffer);
        const address = bufferToHex(addressBuffer);
        // Compare the provided public key with the address(ethereum address)
        return {
          isAddress:
            address.toLocaleLowerCase() === publicKey.toLocaleLowerCase(),
          address
        };
      };

      const message = payload?.wallet_address;
      const signature = payload?.signature_key;
      const signerAddress = payload?.wallet_address;
      // Verify the signature
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
        const role = ADMIN;
        const setData = {
          signerAddress,
          role,
          userAgent: userAgent
        };
        
        // set token in redis
        await redisHelper.client.set(token, JSON.stringify(setData), {
          EX: REDIS_EX_TIME.EXPIRE
        });
        const admin = await mongoDataHelper.findOne(DATA_MODELS.User, {
          walletAddress: signatureVerified?.address.toLocaleLowerCase()
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
            profilePicture: null
          });
        }
        return {
          token,
          data: {
            walletAddress: payload?.wallet_address.toLocaleLowerCase()
          },
          error: false,
          status: 200,
          message: RESPONSE_MESSAGES.LOGIN
        };
      } else {
        return {
          error: true,
          data: { isLogin: false },
          status: STATUS_CODES.UNAUTHORIZED,
          message: RESPONSE_MESSAGES.ADMINNOTFOUND
        };
      }
    } catch (error) {
      return {
        error: true,
        data: { isLogin: false },
        status: STATUS_CODES.INTERNALSERVER,
        message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR
      };
    }
  };
  /**
   * helper function to get the total transactions on the platform
   * @param res
   * @param payload
   * @returns
   */
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
      if (orderTransactions == null && eventTransactions == null) {
        return RESPONSE.NOT_FOUND;
      }
      const transactionData = eventTransactions + orderTransactions;
      if (transactionData) {
        return {
          error: false,
          data: { transactionData },
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS
        };
      } else {
        return RESPONSE.NOT_FOUND
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get total number of diputes has been raised
   * @param res
   * @param payload
   * @returns
   */
  public getTotalDispute = async () => {
    try {
      const total = await mongoDataHelper.getCount(DATA_MODELS.Dispute, {});
      if (total) {
        return {
          error: false,
          data: { total },
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get list of all the raised disputes
   * @param res
   * @param payload
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
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
}
export default new AdminHelper();
