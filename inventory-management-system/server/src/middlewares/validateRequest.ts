import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = { ...req.body, ...parsed };
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validateRequest;
