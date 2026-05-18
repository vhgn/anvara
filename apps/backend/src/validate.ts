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
  return (req, _res, next) => {
    req.body = validator.body ? validator.body.parse(req.body) : req.body;
    req.params = validator.params ? validator.params.parse(req.params) : req.params;
    req.query = validator.query ? validator.query.parse(req.query) : req.query;
    next();
  };
}
