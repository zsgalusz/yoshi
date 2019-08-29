import { FunctionArgs, FunctionResult, UnpackPromise, DSL } from '../types';

export interface HttpClient {
  request<Result extends FunctionResult, Args extends FunctionArgs>(
    { fileName, methodName }: DSL<Result, Args>,
    ...args: Args
  ): Promise<UnpackPromise<Result>>;
}
