import * as express from "express";
import { Request, Response } from "express";
import { Controller } from "../interfaces";
import disputeHelper from "../controller-helpers/dispute.helpers";
import sendResponse from "../responses/response.helper";
import { sessionCheck } from "../middleware/sessionCheck";
import { disputeValidation } from "../validation/dispute.validation";
class DisputeController implements Controller {
    public path = "/dispute";
    public router = express.Router();
    constructor() {
      this.initializeRoutes();
    }
    private initializeRoutes = () => {
      this.router.post(`${this.path}/raiseDispute`,disputeValidation, sessionCheck, this.raiseDispute);
      this.router.get(`${this.path}/getDispute`,sessionCheck, this.getDispute);
      this.router.get(`${this.path}/getDisputeEvent`,sessionCheck, this.getDisputeEvent);
    }
    /**
     * Get dispute details with filters from its helper function for logged in user 
     * @param req 
     * @param res
     * @returns
     */
    private getDispute = async (req: Request, res: Response) => {
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const userAddress = String(req.body.walletAddress);
      const filter = String(req.query.filter);
      const getDispute = await disputeHelper.getDispute(res,{userAddress,filter,page,limit});
      return sendResponse(res,getDispute);
    };
    /**
     * raise a dispute on event  
     * @param req
     * @param res
     * @returns
     */
    private raiseDispute = async (req: Request, res: Response) => {
      const raiseDispute = await disputeHelper.raiseDispute(res,req.body);
      return sendResponse(res,raiseDispute);
    };
    /**
     * Get dispute event details from its helper function for logged in user 
     * @param req 
     * @param res
     * @returns
     */
    private getDisputeEvent = async (req: Request, res: Response) => {
      const userAddress = String(req.body.walletAddress);
      const getDisputeEvent = await disputeHelper.getDisputeEvent(res,{userAddress});
      return sendResponse(res,getDisputeEvent);
    };
  }
  export default DisputeController;