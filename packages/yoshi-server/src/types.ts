import { Request, Response } from 'express';
import { JsonValue } from 'type-fest';
import { WithAspects } from '@wix/wix-express-aspects';

export type OptionalPromise<T> = T | Promise<T>;

export type FunctionContext = {
  req: Request & WithAspects;
  res: Response;
  context: any;
};

export type FunctionArgs = Array<JsonValue>;

export type FunctionResult = OptionalPromise<JsonValue>;

export type ServerFunction<
  Args extends FunctionArgs,
  Result extends FunctionResult
> = (this: FunctionContext, ...args: Args) => Result;

export type DSL<
  Args extends FunctionArgs = [],
  Result extends FunctionResult = null
> = {
  fileName: string;
  methodName: string;
  __fn__: ServerFunction<Args, Result>;
};

export type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
