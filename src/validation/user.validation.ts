import * as Joi from 'joi';
import * as express from 'express';

export const loginValidation = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const schema = Joi.object({
    wallet_address: Joi.string().alphanum().required(),
    signature_key: Joi.string().alphanum().required()
  });

  
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
