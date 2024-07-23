import * as express from "express";
import { Request, Response } from "express";
import { Controller } from "../interfaces";
import AdminHelper from "../controller-helpers/admin.helpers";
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
    this.router.get(`${this.path}/getTotalEvents`,adminCheck,  this.getTotalEvents);
    this.router.get(`${this.path}/getTotalTransaction`,adminCheck, this.getTotalTransaction)
    this.router.get(`${this.path}/getDisputeRaise`,adminCheck,this.getDisputeRaise);
    this.router.get(`${this.path}/getTotalDispute`,adminCheck, this.getTotalDispute);
    this.router.post(`${this.path}/adminLogin`,loginValidation, this.adminLogin)
  }
  private getUser = async (req: Request, res: Response) => {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const getUser = await AdminHelper.getUser(res,{page,limit});
    return sendResponse(res,getUser);
  };
  private getEventsCreators = async (req: Request, res: Response) => {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const getUser = await AdminHelper.getEventsCreators(res,{page,limit});
    return sendResponse(res,getUser);
  };
  private getTotalEvents = async (req: Request, res: Response) => {
    const getTotalEvents: object = await AdminHelper.getTotalEvents();
    return sendResponse(res, getTotalEvents);
  };
  private getTotalDispute = async (req: Request, res: Response) => {
    const getTotalDispute: object = await AdminHelper.getTotalDispute();
    return sendResponse(res, getTotalDispute);
  };
  private getTotalTransaction = async (req: Request, res: Response) => {
    const getTotalTransaction: object = await AdminHelper.getTotalTransaction();
    return sendResponse(res, getTotalTransaction)
  };
  private getClosedPosition = async (req: Request, res: Response) => {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const status = Number(req.query.status)
    const filter = String(req.query.filter)
    const token = String(req.cookies.token)
    const closedPosition:object = await AdminHelper.getClosedPosition(res,{page,limit,status,filter,token});
    return sendResponse(res, closedPosition);
  };
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
  private getDisputeRaise = async (req: Request, res: Response) => {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const getDisputeRaise = await AdminHelper.getDisputeRaise(res,{page,limit});
    return sendResponse(res,getDisputeRaise);
  };
}
export default AdminController;