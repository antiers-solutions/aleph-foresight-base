import "./instrument"
import cors from "cors";
import * as Sentry from "@sentry/node";
import express from "express";
import cookieParser from "cookie-parser";
import { Response, Request, NextFunction } from "express";
import { Controller } from "./interfaces";
import sendResponse from "./responses/response.helper";
import { RESPONSE_MESSAGES, STATUS_CODES } from "./constants";

class App {
  public app: express.Application;
  public req: express.Request;
  public res: express.Response;
  public next: express.NextFunction;

  constructor(controllers: Controller[]) {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
  }
  /**
   * bind the port and start listning for requests
   */
  public listen() {
    Sentry.setupExpressErrorHandler(this.app);
    this.app.listen(process.env.PORT ? Number(process.env.PORT) : 7200, () => {
      console.log(
        `App listening on the port ${
          process.env.PORT ? process.env.PORT : 7200
        }`
      );
    });
  }

  /**
   * only return the http server after binding the port and start listning for requests
   * if you try to call without calling listen then it return default null value as server
   * @returns http server instance
   */
  public getServer(): express.Application {
    return this.app;
  }
  private initializeMiddlewares() {
    this.app.use(
      cors({
        credentials: true,
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
        preflightContinue: true,
      })
    );
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cookieParser());
    this.app.use(function onError(err, req:Request, res: any, next:NextFunction) {
      // The error id is attached to `res.sentry` to be returned
      // and optionally displayed to the user for support.
      res.statusCode = 500;
      res.end(res.sentry + "\n");
      next();
    });
  }

  private initializeControllers(controllers: Controller[]) {
    // Check api status
    this.app.get("/", (req: Request, res: Response) =>
      sendResponse(res, { message: "API Service is up" })
    );

    // Setup the controllers
    controllers.forEach((controller) => {
      this.app.use("/api", controller.router);
    });
    // Unknown routes handler
    this.app.all("*", (req: Request, res: Response) =>
      sendResponse(res, {
        status: STATUS_CODES.NOTFOUND,
        message: RESPONSE_MESSAGES.ROUTE_404,
      })
    );
  }
}

export default App;
