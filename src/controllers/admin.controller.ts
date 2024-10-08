import * as express from "express";
import { Request, Response } from "express";
import { Controller } from "../interfaces";
import AdminHelper from "../controller-helpers/admin.helpers";
import userHelper from "../controller-helpers/user.helper";
import contractHelper from "../controller-helpers/contract.helper";
import sendResponse from "../responses/response.helper";
import { adminCheck } from "../middleware/adminCheck";
import { REDIS_EX_TIME } from "../constants/admin.constant";
import { loginValidation } from "../validation/user.validation";

class AdminController implements Controller {
  public path = "/admin";
  public router = express.Router();
  constructor() {
    this.initializeRoutes();
  }
  private initializeRoutes = () => {
    this.router.get(`${this.path}/getUser`,adminCheck, this.getUser);
    this.router.get(`${this.path}/getEventsCreators`,adminCheck, this.getEventsCreators);
    this.router.get(`${this.path}/getClosedPosition`,adminCheck,this.getClosedPosition);
    this.router.get(`${this.path}/getTotalEventCreators`, adminCheck, this.getTotalEventCreators);
    this.router.get(`${this.path}/getTotalTransaction`,adminCheck, this.getTotalTransaction)
    this.router.get(`${this.path}/getDisputeRaise`,adminCheck,this.getDisputeRaise);
    this.router.get(`${this.path}/getTotalDispute`,adminCheck, this.getTotalDispute);
    this.router.get(`${this.path}/getEventDetails`,adminCheck,this.getEventDetails);
    this.router.get(`${this.path}/logout`,adminCheck, this.userLogout);
    this.router.post(`${this.path}/adminLogin`,loginValidation, this.adminLogin)
  }
  /**
   * It gets the list of users from its helper function
   * @param req
   * @param res
   * @returns
   */
  private getUser = async (req: Request, res: Response) => {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const getUser = await AdminHelper.getUser(res,{page,limit});
    return sendResponse(res,getUser);
  };
  /**
   * It gets the event creators list from its helper function
   * @param req
   * @param res
   * @returns
   */
  private getEventsCreators = async (req: Request, res: Response) => {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const getUser = await AdminHelper.getEventsCreators(res,{page,limit});
    return sendResponse(res,getUser);
  };
  /**
   * It gets the total event creators
   * @param req
   * @param res
   * @returns
   */
  private getTotalEventCreators = async (req: Request, res: Response) => {
    const getTotalEventCreators: object = await AdminHelper.getTotalEventCreators();
    return sendResponse(res, getTotalEventCreators);
  };
  /**
   * It gets the total disputes from its helper function
   * @param req
   * @param res
   * @returns
   */
  private getTotalDispute = async (req: Request, res: Response) => {
    const getTotalDispute: object = await AdminHelper.getTotalDispute();
    return sendResponse(res, getTotalDispute);
  };
  /**
   * It gets the total transaction from its helper function
   * @param req
   * @param res
   * @returns
   */
  private getTotalTransaction = async (req: Request, res: Response) => {
    const getTotalTransaction: object = await AdminHelper.getTotalTransaction();
    return sendResponse(res, getTotalTransaction)
  };
  /**
   * It gets the list of closed position from its helper function
   * user can check for different status and filters 
   * @param req
   * @param res
   * @returns
   */
  private getClosedPosition = async (req: Request, res: Response) => {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const status = Number(req.query.status)
    const filter = String(req.query.filter)
    const token = String(req.cookies.token)
    const closedPosition:object = await AdminHelper.getClosedPosition(res,{page,limit,status,filter,token});
    return sendResponse(res, closedPosition);
  };
  /**
   * It connects the wallet of the admin helps in logging /sign up
   * and sends the cookie with the response
   * @param req 
   * @param res 
   * @returns 
   */
  private adminLogin = async (req: Request, res: Response) => {
    const adminData:object = await AdminHelper.adminLogin(
      res,
      req.body,
      req.headers["user-agent"]
    );
    if (adminData) {
      const token = adminData['token']
      res.cookie("token",token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: new Date(Date.now() + (REDIS_EX_TIME.EXPIRE))
      });
    }
    return sendResponse(res, adminData);
  };
  /**
   * It gets the dispute raised by the users from its helper function 
   * @param req 
   * @param res 
   * @returns 
   */
  private getDisputeRaise = async (req: Request, res: Response) => {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const getDisputeRaise = await AdminHelper.getDisputeRaise(res,{page,limit});
    return sendResponse(res,getDisputeRaise);
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
   * It handles the user logout helper
   * @param req
   * @param res
   * @returns
   */
  private userLogout = async (req: Request, res: Response) => {
    const token = req.cookies.token;
    const check = await userHelper.userLogout(token, res);
    return sendResponse(res, check);
  };
}
export default AdminController;