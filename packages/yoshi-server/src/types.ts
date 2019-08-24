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
  Result extends FunctionResult,
  Args extends FunctionArgs
> = (this: FunctionContext, ...args: Args) => Result;

export type DSL<Result extends FunctionResult, Args extends FunctionArgs> = {
  fileName: string;
  methodName: string;
  __fn__: ServerFunction<Result, Args>;
};

export type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
