import * as Joi from 'joi';
import * as express from 'express';

/**
 * validation while raising the dispute
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export const disputeValidation = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    const schema = Joi.object({
        eventId: Joi.string().required(),
        category: Joi.string().required(),
        email: Joi.string().email().required(),
        description: Joi.string().required(),
        evidence: Joi.array().items(Joi.string()).required()
    })

    const { error } = schema.validate(req.body);
    if (error) {
       const message = error.details[0].message;
       return res.status(403).send({
        message: message.replace(/\"/gi, ''),
       })
    } else {
        next();
    }
   
}