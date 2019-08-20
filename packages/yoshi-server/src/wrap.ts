import { FunctionResult, FunctionArgs, ServerFunction, DSL } from './types';

export function wrap<Args extends FunctionArgs, Result extends FunctionResult>(
  fn: ServerFunction<Args, Result>,
): DSL<Args, Result> {
  // Explain that this is done in build-time
  return { fileName: '', methodName: '', __fn__: fn };
}
