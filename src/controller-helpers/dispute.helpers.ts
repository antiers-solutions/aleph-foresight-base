import { Response } from "express";
import { STATUS_CODES, RESPONSE_MESSAGES, DATA_MODELS } from "../constants";
import mongoDataHelper from "../helpers/mongo.data.helper";
const { getPaginationParams, RESPONSE } = require("./common.helpers");
class DisputeHelper {
  /**
   * get all disputes of an logged in user
   * @param res 
   * @param payload 
   * @returns 
   */
  public getDispute = async (
    res: Response,
    payload: {
      userAddress: string;
      filter: string;
      page: number;
      limit: number;
    }
  ) => {
    try {
      const { page, limit, filter } = payload;
      const { skip, limitValue } = getPaginationParams(page, limit);
      const query: any = { userId: payload.userAddress };
      if (filter === "open" || filter === "closed") {
        query.status = filter;
      }
      const dispute = await mongoDataHelper.findAll(
        DATA_MODELS.Dispute,
        query,
        { createdAt: -1 },
        skip,
        limitValue
      );
      const disputeData = await mongoDataHelper.findAll(DATA_MODELS.Dispute,query);
      if (disputeData==null){
        return RESPONSE.DATA_NOT_FOUND;
      }
      const total = disputeData.length
      if (dispute) {
        return {
          error: false,
          data: { dispute, total },
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
   * helper function to raise dispute on a event by logged in user
   * @param res 
   * @param payload 
   * @returns 
   */
  public raiseDispute = async (
    res: Response,
    payload: {
      eventId: string;
      category: string;
      email: string;
      description: string;
      evidence: string[];
      walletAddress: string;
    }
  ) => {
    try {
      if (!payload.walletAddress) {
        return {
          error: true,
          status: STATUS_CODES.UNAUTHORIZED,
          message: RESPONSE_MESSAGES.UNAUTHORIZED,
        };
      }
      // Check if a dispute already exists
      const existingDispute = await mongoDataHelper.findOne(
        DATA_MODELS.Dispute,
        {
          eventId: payload.eventId,
          userId: payload.walletAddress,
        }
      );
      if (existingDispute) {
        return {
          error: true,
          message: RESPONSE_MESSAGES.DISPUTE,
          data: null,
          status: STATUS_CODES.FORBIDDEN,
        };
      }
      const data = {
        userId: payload.walletAddress,
        eventId: payload.eventId,
        category: payload.category,
        email: payload.email,
        description: payload.description,
        evidenceUrl: payload.evidence,
        status: "closed"
      };
      const saveDispute = await mongoDataHelper.saveData(
        DATA_MODELS.Dispute,
        data
      );
      return {
        error: false,
        message: RESPONSE_MESSAGES.SAVEDATA,
        data: saveDispute,
        status: STATUS_CODES.SUCCESS,
      };
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get the details of event which has been selected to raise the dispute
   * @param res 
   * @param payload 
   * @returns 
   */
  public getDisputeEvent = async (
    res: Response,
    payload: {
      userAddress: string;
    }
  ) => {
    try {
      const query: object = { userId: payload.userAddress.toLocaleLowerCase() };
      const dispute = await mongoDataHelper.findAllResultEvents(
        DATA_MODELS.Events,
        query,
        { createdAt: -1 }
      );
      if (dispute) {
        return {
          error: false,
          data: dispute,
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
export default new DisputeHelper();
