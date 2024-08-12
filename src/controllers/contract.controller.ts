import * as express from "express";
import { Request, Response } from "express";
import { Controller } from "../interfaces";
import contractHelper from "../controller-helpers/contract.helper";
import sendResponse from "../responses/response.helper";
import { sessionCheck } from "../middleware/sessionCheck";

class ContractController implements Controller {
  public path = "/contract";
  public router = express.Router();
  constructor() {
    this.initializeRoutes();
  }
  private initializeRoutes = () => {
    this.router.post(`${this.path}/createIpfsUrl`, this.createIpfsUrl);
    this.router.get(`${this.path}/getEvents`,this.getEvents);
    this.router.get(`${this.path}/getOrder`,this.getOrder);
    this.router.get(`${this.path}/getClosedPosition`,sessionCheck,this.getClosedPosition);
    this.router.get(`${this.path}/getOnEventsBet`,sessionCheck,this.getOnEventsBet);
    this.router.get(`${this.path}/getUserEvent`,sessionCheck,this.getUserEvent);
    this.router.get(`${this.path}/totalTraded`,sessionCheck,this.totalTraded);
    this.router.get(`${this.path}/volumeTraded`,sessionCheck,this.volumeTraded);
    this.router.get(`${this.path}/amountInvested`,sessionCheck,this.amountInvested);
    this.router.get(`${this.path}/netPosition`,sessionCheck,this.netPosition);
    this.router.get(`${this.path}/getEventDetails`,sessionCheck,this.getEventDetails);
    this.router.get(`${this.path}/totalBetOnEvent`,sessionCheck,this.totalBetOnEvent);
    this.router.get(`${this.path}/payout`,sessionCheck,this.payout);
  };
  /**
   * Creates an IPFS URL
   * @param req 
   * @param res 
   * @returns 
   */
  private createIpfsUrl = async (req: Request, res: Response) => {
    const createIpfsUrl = await contractHelper.createIpfsUrl(res, req.body);
    return sendResponse(res,createIpfsUrl);
  };
  /**
   * Retrieves a list of events based on the provided query parameters.
   * @param req 
   * @param res 
   * @returns 
   */
  private getEvents = async (req: Request, res: Response) => {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const filterCoin = String(req.query.filterCoin);
    const filter = String(req.query.filter);
    const search = String(req.query.search);
    const eventData:object = await contractHelper.getEvents(res,
      { page, limit, filterCoin, filter, search }
    );
    return sendResponse(res, eventData);
  };
  /**
   * Retrieves the details of a specific event based on the provided event ID.
   * @param req 
   * @param res 
   * @returns 
   */
  private getEventDetails = async (req: Request, res: Response) => {
    const eventId = String(req.query.eventId);
    const eventData:object = await contractHelper.getEventDetails(res,{ eventId });
    return sendResponse(res, eventData);
  };
  /**
   * Retrieves a list of orders based on the provided query parameters.
   * @param req 
   * @param res 
   * @returns 
   */
  private getOrder = async (req: Request, res: Response) => {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const userAddress = String(req.query.userAddress);
    const filter = String(req.query.filter);
    const orderData:object = await contractHelper.getOrder(res, { page, limit, userAddress, filter});
    return sendResponse(res, orderData);
  };
  /**
   * Retrieves a list of closed positions based on the provided query parameters.
   * @param req 
   * @param res 
   * @returns 
   */
  private getClosedPosition = async (req: Request, res: Response) => {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const statusType = Number(req.query.statusType)
    const userAddress = String(req.body.walletAddress)
    const closedPosition:object = await contractHelper.getClosedPosition(res,
      { page, limit, userAddress, statusType }
    );
    return sendResponse(res, closedPosition);
  };
  /**
   * Retrieves bets of the provided event Id of the user
   * @param req 
   * @param res 
   * @returns 
   */
  private getOnEventsBet = async (req: Request, res: Response) => {
    const userAddress = String(req.body.walletAddress);
    const eventId = String(req.query.eventId);
    const getOnEventsBet: object = await contractHelper.getOnEventsBet(res, { userAddress, eventId });
    return sendResponse(res, getOnEventsBet);
  };
  /**
   * Retrieves a list of events based on the provided query parameters.
   * @param req 
   * @param res 
   * @returns 
   */
  private getUserEvent =async (req:Request,res:Response) => {
    const userAddress = String(req.body.walletAddress);
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const filter = String(req.query.filter)
    const getUserEvent:object = await contractHelper.getUserEvent(res,
      { userAddress, page, limit,filter}
    );
    return sendResponse(res, getUserEvent);
  };
  /**
   * Retrieves the total traded amount of the user
   * @param req 
   * @param res 
   * @returns 
   */
  private totalTraded = async (req: Request, res: Response) => {
    const userAddress = String(req.body.walletAddress);
    const totalTraded:object = await contractHelper.totalTraded(userAddress);
    return sendResponse(res, totalTraded);
  };
  /**
   * Retrieves the total volume traded by the user
   * @param req 
   * @param res 
   * @returns 
   */
  private volumeTraded = async (req: Request, res: Response) => {
    const userAddress = String(req.body.walletAddress);
    const volumeTraded: object = await contractHelper.volumeTraded(userAddress);
    return sendResponse(res, volumeTraded);
  };
  /**
   * Retrieves the amount Invested by the user
   * @param req 
   * @param res 
   * @returns 
   */
  private amountInvested = async (req: Request, res: Response) => {
    const userAddress = String(req.body.walletAddress);
    const amountInvested: object = await contractHelper.amountInvested(userAddress);
    return sendResponse(res, amountInvested);
  };
  /**
   * Retrieves the profile and loss of the user
   * @param req 
   * @param res 
   * @returns 
   */
  private netPosition = async (req: Request, res: Response) => {
    const userAddress = String(req.body.walletAddress);
    const netPosition: object = await contractHelper.netPosition(userAddress);
    return sendResponse(res, netPosition);
  };
  /**
   * Retrieves the total bet on the event
   * @param req 
   * @param res 
   * @returns 
   */
  private totalBetOnEvent = async (req: Request, res: Response) => {
    const eventId = String(req.query.eventId);
    const totalBetOnEvent:object = await contractHelper.totalBetOnEvent(eventId);
    return sendResponse(res, totalBetOnEvent);
  };
  /**
   * Retrieves the payout on the event
   * @param req 
   * @param res 
   * @returns 
   */
  private payout = async(req:Request,res:Response) =>{
    const userAddress = String(req.body.walletAddress);
    const eventId = String(req.query.eventId);
    const payoutEvent:object = await contractHelper.payout(userAddress,eventId);
    return sendResponse(res, payoutEvent);
  }
}

export default ContractController;
