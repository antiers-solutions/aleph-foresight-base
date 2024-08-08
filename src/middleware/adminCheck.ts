import { Response, Request, NextFunction } from 'express';
import redisHelper from '../helpers/redis.helper';
import sendResponse from '../responses/response.helper';
const {getAdminAddress, isTokenExpired} = require( '../controller-helpers/common.helpers')
import { RESPONSE_MESSAGES, STATUS_CODES, ADMIN } from '../constants';

/**
 * It is use to check if the cookie in requests exists and then verifies it
 * and extends the session time for the use for every request made
 * @param req
 * @param res
 * @param next
 * @returns
 */

export const adminCheck =  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {  
      // fetch the admin address from contract
      const adminAddress = await getAdminAddress();
      const token = String(req.cookies.token);
      // check for token
      if (!token || token == undefined || await isTokenExpired(token)) {
        return sendResponse(res, {
          message: RESPONSE_MESSAGES.UNAUTHORIZED,
          status: STATUS_CODES.UNAUTHORIZED
        });
      }

      const value = JSON.parse(await redisHelper.client.get(token));

    
      const userAgentRequest = req.headers['user-agent'];

      if (value.userAgent == userAgentRequest && value.signerAddress.toLocaleLowerCase() == adminAddress.toLocaleLowerCase() 
        && value.role == ADMIN) {
           // updating the token time for session login
          await redisHelper.updateRedisTime(
            token,
          );
          req.body.walletAddress = value.signerAddress.toLocaleLowerCase()
          // if the admin access token is found and valid proceed the user to its request
            next();
      }
      else {
        return sendResponse(res, {
          message: RESPONSE_MESSAGES.UNAUTHORIZED,
          status: STATUS_CODES.UNAUTHORIZED
        });
      }
    } catch (error){
      return sendResponse(res, {
        message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR,
        status: STATUS_CODES.INTERNALSERVER,
      });
    }
};