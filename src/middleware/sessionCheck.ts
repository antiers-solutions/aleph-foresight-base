import { Response, Request, NextFunction } from "express";
import redisHelper from "../helpers/redis.helper";
import sendResponse from "../responses/response.helper";
import { RESPONSE_MESSAGES, STATUS_CODES } from "../constants";
const { isTokenExpired } = require("../controller-helpers/common.helpers");

/**
 * It is use to check if the cookie in requests exists and then verifies it
 * and extends the session time for the use for every request made
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const sessionCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;
    if (!token || token == undefined || (await isTokenExpired(token))) {
      return sendResponse(res, {
        message: RESPONSE_MESSAGES.UNAUTHORIZED,
        status: STATUS_CODES.UNAUTHORIZED
      });
    }
    const value = JSON.parse(await redisHelper.client.get(token));
    console.log("value ===>>>", value);

    const userAgentRequest = req.headers["user-agent"];

    if (value.userAgent == userAgentRequest && value.signerAddress) {
      // updating the token time for session login
      await redisHelper.updateRedisTime(token);
      req.body.walletAddress = value.signerAddress.toLocaleLowerCase();
      // if the user access token is found and valid proceed the user to its request
      next();
    } else {
      return sendResponse(res, {
        message: RESPONSE_MESSAGES.UNAUTHORIZED,
        status: STATUS_CODES.UNAUTHORIZED
      });
    }
  } catch (err) {
    console.log(err);
    return sendResponse(res, {
      message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR,
      status: STATUS_CODES.INTERNALSERVER
    });
  }
};
