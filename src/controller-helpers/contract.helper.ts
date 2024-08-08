import { Response } from "express";
import { create } from "ipfs-http-client";
const {
  getPaginationParams,
  RESPONSE,
  calculatePayout,
} = require("./common.helpers");
import mongoDataHelper from "../helpers/mongo.data.helper";
import {
  STATUS_CODES,
  RESPONSE_MESSAGES,
  DATA_MODELS,
  UNDEFINED,
} from "../constants";
import { RESPONSE_MESSAGE } from "../constants/contract.constant";
const ipfs = create({
  url: process.env.IPFSURL,
});

class ContractHelper {
  /**
   * helper function to create IPFS url
   * @param res
   * @param payload
   * @returns
   */
  createIpfsUrl = async (
    res: Response,
    payload: {
      eventName: string;
      price: number;
      timeStamp: number;
    }
  ) => {
    try {
      const data = {
        name: payload.eventName,
        price: payload.price,
        timestamp: payload.timeStamp,
      };
      const jsonData = JSON.stringify(data);
      // Add the JSON string to IPFS
      const { path } = await ipfs.add(jsonData);
      return {
        error: false,
        message: RESPONSE_MESSAGE.IPFS_CREATE_SUCCESS,
        data: `${path}`,
        status: STATUS_CODES.SUCCESS,
      };
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   *  helper function to get all the events on platform
   * @param res
   * @param payload
   * @returns
   */
  public getEvents = async (
    res: Response,
    payload: {
      page: number;
      limit: number;
      filterCoin?: string;
      filter?: string;
      search?: string;
    }
  ) => {
    try {
      const { page, limit, filterCoin, filter, search } = payload;
      const { skip, limitValue } = getPaginationParams(page, limit);
      const query: any = {};
      // filter based on type of currency
      if (
        filterCoin !== undefined &&
        filterCoin.trim() !== "" &&
        filterCoin !== UNDEFINED
      ) {
        query.currencyType = filterCoin;
      }
      const sortOptions: any = {};
      switch (filter) {
        case "closingSoon":
          sortOptions.convertedDate = 1; // Ascending order for closing soon
          break;
        case "newlyAdded":
          sortOptions.createdAt = -1; // Newly added events, descending order by creation date
          break;
        case "price":
          query.priceLevel = { $exists: true }; // Example condition for price filter
          sortOptions.priceLevel = -1; // Default sorting by priceLevel in descending order
          break;
        case "volume":
          sortOptions.totalVolume = -1; //Events based on totalvolume, descending order based on total volume on event
          break;
        case undefined:
        default:
          sortOptions.createdAt = -1; // Default sorting by creation date in descending order
          break;
      }
      const eventsData = await mongoDataHelper.findAllEvent(
        DATA_MODELS.Events,
        query,
        sortOptions,
        skip,
        limitValue,
        search
      );
      if (eventsData) {
        return {
          error: false,
          data: eventsData,
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_EVENTSDATA_SUCCESS,
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get details of an event
   * @param res
   * @param payload
   * @returns
   */
  public getEventDetails = async (
    res: Response,
    payload: { eventId: string }
  ) => {
    try {
      const eventsDetails = await mongoDataHelper.findEventPrice(
        DATA_MODELS.Events,
        {
          eventId: payload.eventId,
        }
      );
      if (eventsDetails) {
        return {
          error: false,
          data: { eventsDetails },
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_EVENTSDATA_SUCCESS,
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get orders (activity) of users
   * @param res
   * @param payload
   * @returns
   */
  public getOrder = async (
    res: Response,
    payload: {
      page: number;
      limit: number;
      userAddress: string;
      filter: string;
    }
  ) => {
    try {
      const { page, limit, userAddress, filter } = payload;
      const { skip, limitValue } = getPaginationParams(page, limit);
      // query to get order[activity] of a specific user and all users
      let query =
        userAddress != UNDEFINED
          ? { userId: userAddress.toLocaleLowerCase() }
          : {};
      // filter for queried user
      if (userAddress && filter != UNDEFINED) {
        let status: object = {};
        switch (filter) {
          case "withdraw":
            status = {
              bidType: "withdraw",
            };
            break;
          case "claimed":
            status = {
              bidType: "claimed",
            };
            break;
          case "yes":
            status = {
              bidType: "true",
            };
            break;
          case "no":
            status = {
              bidType: "false",
            };
            break;
        }
        query = { ...query, ...status };
      }
      const ordersData = await mongoDataHelper.findAllOrdersUser(
        DATA_MODELS.Order,
        query,
        { updatedAt: -1 },
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
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get the list of closed position [events] of logged in user
   * @param res
   * @param payload
   * @returns
   */
  public getClosedPosition = async (
    res: Response,
    payload: {
      page: number;
      limit: number;
      userAddress: string;
      statusType: number;
    }
  ) => {
    try {
      const { page, limit, userAddress, statusType } = payload;
      const { skip, limitValue } = getPaginationParams(page, limit);
      const ordersData = await mongoDataHelper.findAllClosedPosition(
        DATA_MODELS.Order,
        { userId: userAddress.toLocaleLowerCase() },
        skip,
        limitValue,
        statusType
      );
      if (ordersData) {
        return {
          error: false,
          data: ordersData,
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_DATA_SUCCESS,
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      console.log(error);
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get bets {yes , no} on an event
   * @param res
   * @param payload
   * @returns
   */
  public getOnEventsBet = async (
    res: Response,
    payload: {
      userAddress: string;
      eventId: string;
    }
  ) => {
    try {
      // bid on yes
      const trueOrder = await mongoDataHelper.findAll(
        DATA_MODELS.Order,
        {
          userId: payload.userAddress.toLocaleLowerCase(),
          eventId: payload.eventId,
          bidType: "true",
        },
        { createdAt: -1 }
      );
      if (trueOrder == null) {
        return RESPONSE.DATA_NOT_FOUND;
      }
      // bid on no
      const falseOrder = await mongoDataHelper.findAll(
        DATA_MODELS.Order,
        {
          userId: payload.userAddress.toLocaleLowerCase(),
          eventId: payload.eventId,
          bidType: "false",
        },
        { createdAt: -1 }
      );
      if (falseOrder == null) {
        return RESPONSE.DATA_NOT_FOUND;
      }
      const eventOnBett: Array<Object> = [];
      if (trueOrder.length) {
        eventOnBett.push(trueOrder[0]);
      }
      if (falseOrder.length) {
        eventOnBett.push(falseOrder[0]);
      }
      if (eventOnBett.length) {
        return {
          error: false,
          data: eventOnBett,
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_EVENTSDATA_SUCCESS,
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get events created by logged in user
   * @param res
   * @param payload
   * @returns
   */
  public getUserEvent = async (
    res: Response,
    payload: {
      userAddress: string;
      page: number;
      limit: number;
      filter: string;
    }
  ) => {
    try {
      const { page, limit, filter } = payload;
      const { skip, limitValue } = getPaginationParams(page, limit);
      const query: any = { userId: payload.userAddress.toLocaleLowerCase() };
      switch (filter) {
        case "open":
          query.status = 1;
          break;
        case "closed":
          query.status = 0;
          break;
      }
      const userCreateEvnt = await mongoDataHelper.findAllNoBet(
        DATA_MODELS.Events,
        query,
        { createdAt: -1 },
        skip,
        limitValue
      );
      if (userCreateEvnt) {
        return {
          error: false,
          data: userCreateEvnt,
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_EVENTSDATA_SUCCESS,
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get total traded amount of logged in user
   * @param res
   * @param payload
   * @returns
   */
  public totalTraded = async (userAddress: string) => {
    try {
      const total = await mongoDataHelper.findAllEventTraded(
        DATA_MODELS.Order,
        {
          userId: userAddress,
        }
      );
      if (total) {
        return {
          error: false,
          data: { total },
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_EVENTSDATA_SUCCESS,
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get total volume traded of logged in user
   * @param res
   * @param payload
   * @returns
   */
  public volumeTraded = async (userAddress: string) => {
    try {
      let volumeTraded = await mongoDataHelper.findAllSum(DATA_MODELS.Order, {
        userId: userAddress,
      });
      if (volumeTraded == null) {
        return RESPONSE.DATA_NOT_FOUND;
      }
      volumeTraded = volumeTraded?.volumeTraded;
      if (volumeTraded) {
        return {
          error: false,
          data: { volumeTraded },
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_EVENTSDATA_SUCCESS,
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get profit and loss bear by logged in user
   * @param res
   * @param payload
   * @returns
   */
  public netPosition = async (userAddress: string) => {
    try {
      const trueAmountResult = await mongoDataHelper.findSumNetPosition(
        DATA_MODELS.Order,
        { userId: userAddress.toLocaleLowerCase() },
        1
      );
      if (trueAmountResult == null) {
        return RESPONSE.DATA_NOT_FOUND;
      }
      const falseAmountResult = await mongoDataHelper.findSumNetPosition(
        DATA_MODELS.Order,
        { userId: userAddress.toLocaleLowerCase() },
        0
      );
      if (falseAmountResult == null) {
        return RESPONSE.NOT_FOUND;
      }
      const totalAmountClaimed = trueAmountResult
        ? trueAmountResult.totalAmountClaimed
        : 0;
      const totalAmount1 = trueAmountResult ? trueAmountResult.totalAmount1 : 0;
      const totalAmount2 = falseAmountResult
        ? falseAmountResult.totalAmount2
        : 0;
      // Calculate totalProfit and netPosition
      const totalProfit =
        totalAmountClaimed / 10 ** 18 - totalAmount1 / 10 ** 18;
      const netPosition = totalProfit - totalAmount2 / 10 ** 18;
      if (netPosition || netPosition === 0) {
        return {
          error: false,
          data: { netPosition },
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_EVENTSDATA_SUCCESS,
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get profit and loss bear by logged in user
   * @param res
   * @param payload
   * @returns
   */
  public totalBetOnEvent = async (eventId: string) => {
    try {
      const totalBetOnEvent = await mongoDataHelper.getCount(DATA_MODELS.Order, {
        eventId: eventId,
      });
      
      if (totalBetOnEvent) {
        return {
          error: false,
          data: { totalBetOnEvent },
          status: STATUS_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.FETCH_EVENTSDATA_SUCCESS,
        };
      } else {
        return RESPONSE.NOT_FOUND;
      }
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
  /**
   * helper function to get gross payout and net payout
   * @param res
   * @param payload
   * @returns
   */
  public payout = async (userAddress: string, eventId: string) => {
    try {
      const userCreateEvnt = await mongoDataHelper.eventOdds(
        DATA_MODELS.Order,
        { userId: userAddress, eventId: eventId, result: 1 }
      );
      if (!userCreateEvnt.length) {
        return RESPONSE.NOT_FOUND;
      }
      const platformFees = userCreateEvnt[0]?.platformFees;
      const isSettlementYes = userCreateEvnt[0]?.settlement === "Yes";
      const odds = userCreateEvnt[0]?.odds[isSettlementYes ? 0 : 1];
      const amount = userCreateEvnt[0]?.amount;
      const { grossPayout, netPayout } = calculatePayout(
        amount,
        odds,
        platformFees
      );
      return {
        error: false,
        data: { grossPayout, netPayout, platformFees },
        status: STATUS_CODES.SUCCESS,
        message: RESPONSE_MESSAGES.FETCH_EVENTSDATA_SUCCESS,
      };
    } catch (error) {
      return RESPONSE.INTERNAL_SERVER_ERROR;
    }
  };
}
export default new ContractHelper();
