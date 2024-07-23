import { STATUS_CODES, RESPONSE_MESSAGES } from '../constants';
import { ESResponse } from '../interfaces';
import { Response } from 'express';

// send response
function sendResponse(res: Response, resData: ESResponse) {
  try {
    //check if a status code arrive
    const statusCode = resData?.status || STATUS_CODES.SUCCESS;
    const customMessage = resData?.message;

    //check if there is any message or status code 500 then send response accordingly
    if (customMessage && statusCode !== STATUS_CODES.NOTFOUND)
      res
        .status(statusCode)
        .send({ message: customMessage, data: resData?.data });
    else if (statusCode === STATUS_CODES.INTERNALSERVER)
      res
        .status(statusCode)
        .send({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
    else if (statusCode === STATUS_CODES.NOTFOUND)
      res.status(statusCode).send({
        message: customMessage || RESPONSE_MESSAGES.NOT_FOUND,
        data: null
      });
    else res.status(statusCode).send({ data: resData.data });
  } catch (err) {
    res
      .status(STATUS_CODES.INTERNALSERVER)
      .send({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
}

export default sendResponse;
