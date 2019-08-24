import { FunctionResult, FunctionArgs, ServerFunction, DSL } from './types';

export function wrap<Args extends FunctionArgs, Result extends FunctionResult>(
  fn: ServerFunction<Result, Args>,
): DSL<Result, Args> {
  // Explain that this is done in build-time
  return { fileName: '', methodName: '', __fn__: fn };
}
