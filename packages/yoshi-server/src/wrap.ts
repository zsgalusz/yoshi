import {
  FunctionResult,
  FunctionArgs,
  ServerFunction,
  RouteFunction,
  DSL,
} from './types';

export function fn<Args extends FunctionArgs, Result extends FunctionResult>(
  _fn_: ServerFunction<Result, Args>,
): DSL<Result, Args> {
  // Explain that this is done in build-time
  return { fileName: '', methodName: '', __fn__: _fn_ };
}

export function route<Result extends FunctionResult>(
  _route_: RouteFunction<Result>,
): RouteFunction<Result> {
  return _route_;
}
