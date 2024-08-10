import * as express from "express";
import { Request, Response } from "express";
import multer from "multer";
import { Controller } from "../interfaces";
import UserHelper from "../controller-helpers/user.helper";
import userHelper from "../controller-helpers/user.helper";
import sendResponse from "../responses/response.helper";
import { sessionCheck } from "../middleware/sessionCheck";
import { REDIS_EX_TIME } from "../constants/user.constant";
import { loginValidation } from "../validation/user.validation";
class UserController implements Controller {
  public path = "/user";
  public router = express.Router();
  upload = multer({
    fileFilter: function (req, file, cb) {
      if (file.mimetype == 'image/png' || file.mimetype == 'image/jpeg' || file.mimetype == 'image/jpg') {
        return cb(null, true);
      }
      req.fileValidationError = 'Invalid Upload: file type should be of PNG, JPG or JPEG format';
      return cb(null, false);
      }

  });

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes = () => {
    this.router.post(`${this.path}/connect-wallet`,loginValidation, this.connectWallet);
    this.router.put(
      `${this.path}/upload-profile`,
      this.upload.single("file"),
      sessionCheck,
      this.uploadProfile
    );
    this.router.get(`${this.path}/getTotalEvents`,  this.getTotalEvents);
    this.router.get(`${this.path}/getTotalUser`,  this.getTotalUser);
    this.router.get(`${this.path}/getTotalVolume`,  this.getTotalVolume);
    this.router.get(`${this.path}/get-profile`, sessionCheck, this.getProfile)
    this.router.get(`${this.path}/logout`,sessionCheck, this.userLogout);
    this.router.get(`${this.path}/me`,sessionCheck,this.me);
  };

  /**
   * It connects the wallet of the user helps in logging /sign up
   * and sends the cookie with the response
   * @param req
   * @param res
   * @returns
   */
  private connectWallet = async (req: Request, res: Response) => {
    const userData = await UserHelper.connectWallet(
      res,
      req.body,
      req.headers["user-agent"]
    );
    if (userData?.token) {
      res.cookie("token",userData.token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: new Date(Date.now() + (REDIS_EX_TIME.EXPIRE))
      });
    }
    return sendResponse(res, userData);
  };
  /**
   * It upload user profile picture and user name
   * @param req
   * @param res
   * @returns
   */
  private uploadProfile = async (req: Request, res: Response) => {
    const fileUrl: object = await userHelper.uploadProfile(req);
    return sendResponse(res, fileUrl);
  };
  /**
   * It gets the total events from its helper function
   * @param req
   * @param res
   * @returns
   */
  private getTotalEvents = async (req: Request, res: Response) => {
    const getTotalEvents: object = await userHelper.getTotalEvents();
    return sendResponse(res, getTotalEvents);
  };
  /**
   * It gets the total users
   * @param req
   * @param res
   * @returns
   */
  private getTotalUser = async (req: Request, res: Response) => {
    const getTotalUser: object = await userHelper.getTotalUser();
    return sendResponse(res, getTotalUser);
  };
  /**
   * It gets the total volume 
   * @param req
   * @param res
   * @returns
   */
  private getTotalVolume = async (req: Request, res: Response) => {
    const getTotalVolume: object = await userHelper.getTotalVolume();
    return sendResponse(res, getTotalVolume);
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
  /**
   * gets the user profile 
   * @param req
   * @param res
   * @returns
   */
  private getProfile = async (req: Request, res: Response) => {
    const walletaddress = req.body.walletAddress;
    const userData: object = await userHelper.getProfileData((walletaddress));
    return sendResponse(res, userData);
  };
  /**
   * gets the user details 
   * @param req
   * @param res
   * @returns
   */
  private me = async (req: Request, res: Response) => {
    const userAddress = String(req.body.walletAddress);
    const userDetails: object = await userHelper.me(userAddress);
    return sendResponse(res, userDetails);
  };
}

export default UserController;
