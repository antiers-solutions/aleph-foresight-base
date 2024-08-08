const { RESPONSE } = require("./common.helpers");
import mongoDataHelper from "../helpers/mongo.data.helper";
import { STATUS_CODES, RESPONSE_MESSAGES, DATA_MODELS } from "../constants";

class CurrencyHelper {
  /**
   * get all the top currency in the market
   * @returns
   */
  public getTopMarket = async () => {
    try {
      const currency = await mongoDataHelper.findAll(DATA_MODELS.Currency, {});
      if (currency) {
        return {
          error: false,
          data: { Currency: currency },
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
   * get the current price of the currency
   * @param coin
   * @returns
   */
  public getCurrentPrice = async (coin: string) => {
    try {
      const currency = await mongoDataHelper.findPrice(DATA_MODELS.Currency, {
        symbol: coin,
      });
      if (currency) {
        return {
          error: false,
          data: { Currency: currency },
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
}
export default new CurrencyHelper();
