import { Response } from "express";
const AWS = require("aws-sdk");
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import {
  ecrecover,
  fromRpcSig,
  keccak256,
  bufferToHex,
  pubToAddress
} from "ethereumjs-util";
import { ESResponse } from "@interfaces";
import { ApiResponse } from "interfaces/user.helpers.interface";
const { getAdminAddress, RESPONSE } = require("./common.helpers");
import mongoDataHelper from "../helpers/mongo.data.helper";
import redisHelper from "../helpers/redis.helper";
import {
  STATUS_CODES,
  RESPONSE_MESSAGES,
  DATA_MODELS,
  REDIS_VARIABLES,
} from "../constants";
import { ROLE, REDIS_EX_TIME } from "../constants/user.constant";
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION, // e.g., 'us-east-1'
});
const s3 = new AWS.S3();

class UserHelper {
  constructor() {
    (async () => { })();
  }
  /**
   * The user sign-in helper handles all the login operations and checks for valid users
   * @param res
   * @param payload
   * @param userAgent
   * @returns
   */
  connectWallet = async (
    res: Response,
    payload: {
      wallet_address: string;
      signature_key: string;
    },
    userAgent: string
  ): Promise<ApiResponse> => {
    try {
      // Function to verify the signature
      const adminAddress = await getAdminAddress();
      const verifyPersonalSign = (
        message: string,
        signature: string,
        publicKey: string
      ) => {
        // This line creates a buffer from the message string passed into the function. Buffers are Node.js' way of handling binary data.
        const messageBuffer = Buffer.from(message);
        //This line creates a prefix as required by Ethereum's message signing standard (EIP-191). It's a string that specifies the type of message and its length
        const prefix = Buffer.from(
          "\x19Ethereum Signed Message:\n" + messageBuffer.length,
          "utf-8"
        );
        //This line calculates the Keccak-256 hash (also known as SHA-3) of the concatenated prefix and message buffer.
        const msgHash = keccak256(Buffer.concat([prefix, messageBuffer]));
        // Parse the signature
        const sig = fromRpcSig(signature);
        const publicKeyRecovered = ecrecover(msgHash, sig.v, sig.r, sig.s);
        // Derive the Ethereum address from the recovered public key
        const recoveredAddress = bufferToHex(pubToAddress(publicKeyRecovered));
        // Compare the provided public key with the recovered public key
        return { isAddress: recoveredAddress.toLowerCase() === publicKey.toLowerCase(), recoveredAddress };
      };
      const message = payload?.wallet_address;
      const signature = payload?.signature_key;
      const signerAddress = payload?.wallet_address;
      // Verify the signature
      const isSignatureValid = verifyPersonalSign(
        message,
        signature,
        signerAddress
      );
      if (isSignatureValid?.isAddress) {
        const token = uuidv4()
        const role = ROLE.USER;
        const setData = {
          signerAddress,
          role,
          userAgent: userAgent,
          token
        };
        // set token in redis
        await redisHelper.client.set(token, JSON.stringify(setData), {
          EX: REDIS_EX_TIME.EXPIRE,
        });
        const userCheckdata = await mongoDataHelper.findOne(DATA_MODELS.User, {
          walletAddress: isSignatureValid?.recoveredAddress,
        });
        if (!userCheckdata) {
          await mongoDataHelper.saveData(DATA_MODELS.User, {
            ensId: null,
            fullUserName: null,
            userName: null,
            walletAddress: payload?.wallet_address.toLocaleLowerCase(),
            email: null,
            role: ROLE.USER,
            status: true,
            password: null,
            profilePicture: null,
          });
        }
        return {
          token,
          data: {
            wallet_address: payload?.wallet_address.toLocaleLowerCase(),
          },
          error: false,
          status: 200,
          message: RESPONSE_MESSAGES.SIGNUP,
        };
      }
    } catch (err) {
      return {
        error: true,
        data: { isLogin: false },
        status: STATUS_CODES.INTERNALSERVER,
        message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR,
      };
    }
  };
  /**
   * User edit profile Picture
   * @param req
   * @returns
   */
  public uploadProfile = async (req: any) => {
    try {
      const userAddress = req.body.walletAddress;
      const userName = req.body.userName;
      const ensId = req.body.ensId; //aleph id
      const file = req.file || req.body.file; // profile picture
      // validation for file type
      if (req.fileValidationError){
        return {
          error: true,
          status: STATUS_CODES.BADREQUEST,
          message: req.fileValidationError,
        };
      }
      let imageObj:object = {};
      if (file !== undefined) {
        const fileContent = file.buffer;
        const fileName = Date.now() + "-" + file.originalname;
        // Resize the image
        const sizes = [
        { name: 'small', width: 100 },
        { name: 'medium', width: 300 },
        { name: 'large', width: 800 },
        ];
        imageObj = { small: "", medium: "", large: "" }
        const uploadPromises = sizes.map(async size => {
        const resizedImage = await sharp(fileContent)
          .resize({ width: size.width })
          .toBuffer();

        // Upload to S3
        const params = {
          Bucket: process.env.S3_BUCKET,
          Key: `${fileName}/${Date.now()}/${size.name}}`,
          Body: resizedImage,
          ContentType: req.file.mimetype,
        };
        const saved = await s3.upload(params).promise();
        // replace the s3 url to cloudfront url
        imageObj[size.name] = saved.Location.replace(`${process.env.S3_BUCKET_URL}`, `${process.env.CLOUDFRONT_URL}`);

      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      }
      
      const userCheckdata = await mongoDataHelper.findOne(DATA_MODELS.User, {
        walletAddress: userAddress,
      });
      // check for existing user
      if (userName) {
        const existingUserName = await mongoDataHelper.findOne(DATA_MODELS.User, {
          userName: userName,
          walletAddress: { $ne: userAddress }
        });
        if (existingUserName) {
          return {
            error: true,
            status: STATUS_CODES.FORBIDDEN,
            data: null,
            message: RESPONSE_MESSAGES.USERNAME_EXIST,
          };
        }
      }
      if (userCheckdata) {
        const updateFields:{ensId?:string, userName?:string, profilePicture?:object } = {};
        ensId  && (updateFields.ensId=ensId);
        userName && (updateFields.userName=userName);
        // if file is there update else keep the previous profile
        imageObj && (updateFields.profilePicture=file?imageObj:userCheckdata.profilePicture);
        await mongoDataHelper.findOneAndUpdate(
          DATA_MODELS.User,
          { walletAddress: userAddress },
          {
            $set: updateFields,
          }
        );
        return {
          error: false,
          message: RESPONSE_MESSAGES.UPDATED_SUCCESS,
        };
      } else {
        return RESPONSE.USER_NOT_FOUND;
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
        return RESPONSE.USER_NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get the total number of users on platform
   * @returns 
   */
  public getTotalUser = async () => {
    try {
      const userData = await mongoDataHelper.findAll(DATA_MODELS.User, {});
      if (userData==null){
        return RESPONSE.DATA_NOT_FOUND;
      }
      const total = userData.length;
      if (total) {
        return {
          error: false,
          data: { totalUsers: total },
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_USER_SUCCESS,
        };
      } else {
        return RESPONSE.USER_NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get the total volume (amount spent) on platform 
   * @returns 
   */
  public getTotalVolume = async (
  ) => {
    try {
      const volumeData = await mongoDataHelper.findAllSum(DATA_MODELS.Order, {})
      if (volumeData==null){
        return RESPONSE.DATA_NOT_FOUND;
      }
      const totalVolume = volumeData?.volumeTraded / 10 ** 18;
      if (totalVolume) {
        return {
          error: false,
          data: { totalVolume },
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
   *  helper function to get  user's profile 
   * @returns
   */
  public getProfileData = async (wallet_address) => {
    try {
      const userCheckdata = await mongoDataHelper.findOne(DATA_MODELS.User, {
        walletAddress: wallet_address,
      });
      if (userCheckdata) {
        return {
          error: true,
          data: { userCheckdata },
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_USER_SUCCESS,
        };
      } else {
        return RESPONSE.USER_NOT_FOUND;
      }
    } catch (error) {
      console.log(error)
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper handles the logout
   * @param token
   * @returns
   */
  public userLogout = async (
    token: string,
    res: Response
  ): Promise<ESResponse> => {
    try {
      // this reomves the token from the redis hence preventing the re-login
      await redisHelper.removeFromRedis(REDIS_VARIABLES.UserData, token);
      await redisHelper.removeFromRedis(REDIS_VARIABLES.UserAgent, token);
      res.clearCookie(token);
      return {
        message: RESPONSE_MESSAGES.LOGOUT,
        status: STATUS_CODES.SUCCESS,
        error: false,
      };
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
}

export default new UserHelper();
