import { Request, Response } from 'express';
import { JsonValue } from 'type-fest';

// General stuff
export type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
export type OptionalPromise<T> = T | Promise<T>;
export type FunctionArgs = Array<JsonValue>;
export type FunctionResult = OptionalPromise<JsonValue>;

// Server function types
export type FunctionContext = {
  req: Request;
  res: Response;
  context: any;
};

export type ServerFunction<
  Result extends FunctionResult,
  Args extends FunctionArgs
> = (this: FunctionContext, ...args: Args) => Result;

export type DSL<Result extends FunctionResult, Args extends FunctionArgs> = {
  fileName: string;
  methodName: string;
  __fn__: ServerFunction<Result, Args>;
};

// Route function types
export type RouteContext = {
  req: Request;
  res: Response;
  context: any;
  params: { [name: string]: any | undefined };
};

export type RouteFunction<Result extends FunctionResult> = (
  this: RouteContext,
) => Result;
