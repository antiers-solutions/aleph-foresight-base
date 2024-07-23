import * as express from "express";
import { Request, Response } from "express";
import { Controller } from "../interfaces";
import currencyHelper from "../controller-helpers/currency.helper";
import sendResponse from "../responses/response.helper";
class CurrencyController implements Controller {
  public path = "/currency";
  public router = express.Router();
  constructor() {
    this.initializeRoutes();
  }
  private initializeRoutes = () => {
    this.router.get(`${this.path}/getTopMarket`, this.getTopMarket);
    this.router.get(`${this.path}/getCurrentPrice`, this.getCurrentPrice);
  }
  private getTopMarket = async (req: Request, res: Response) => {
    const getTopMarket = await currencyHelper.getTopMarket();
    return sendResponse(res,getTopMarket);
  };
  private getCurrentPrice = async (req: Request, res: Response) => {
    const coin = String(req.query.coin)
    const getCurrentPrice = await currencyHelper.getCurrentPrice(coin);
    return sendResponse(res,getCurrentPrice);
  };
}
export default CurrencyController;
