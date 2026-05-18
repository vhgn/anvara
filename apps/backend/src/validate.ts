import { type RequestHandler } from 'express';
import z from 'zod';

export type PartValidator = z.ZodType;
export type RouteValidator<
  TRequestBody extends PartValidator,
  TRequestQuery extends PartValidator,
  TRequestParams extends PartValidator,
> = {
  params?: TRequestParams;
  query?: TRequestQuery;
  body?: TRequestBody;
};

export function validate<TValidator extends RouteValidator<any, any, any>>(
  validator: TValidator
): RequestHandler<
  z.output<TValidator['params']>,
  any,
  z.output<TValidator['body']>,
  z.output<TValidator['query']>,
  any
> {
  return (req, res, next) => {
    try {
      Object.defineProperties(req, {
        body: {
          value: validator.body ? validator.body.parse(req.body) : req.body,
          writable: true,
          configurable: true,
          enumerable: true,
        },
        query: {
          value: validator.query ? validator.query.parse(req.query) : req.query,
          writable: true,
          configurable: true,
          enumerable: true,
        },
        params: {
          value: validator.params ? validator.params.parse(req.params) : req.params,
          writable: true,
          configurable: true,
          enumerable: true,
        }
      })
      next();
    } catch (e) {
      console.error("Failed to validate", e)
      res.status(400).json({ error: String(e) })
    }
  };
}
