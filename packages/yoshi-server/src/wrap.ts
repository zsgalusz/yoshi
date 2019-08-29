import {
  FunctionResult,
  FunctionArgs,
  ServerFunction,
  RouteFunction,
  DSL,
} from './types';

export function method<
  Args extends FunctionArgs,
  Result extends FunctionResult
>(fn: ServerFunction<Result, Args>): DSL<Result, Args> {
  // Explain that this is done in build-time
  return { fileName: '', methodName: '', __fn__: fn };
}

export function route<Result extends FunctionResult>(
  fn: RouteFunction<Result>,
): RouteFunction<Result> {
  return fn;
}
