import { FunctionArgs, FunctionResult, UnpackPromise, DSL } from '../types';

export interface HttpClient {
  batch<
    Result1 extends FunctionResult,
    Args1 extends FunctionArgs,
    Result2 extends FunctionResult,
    Args2 extends FunctionArgs
  >(
    t1: [DSL<Result1, Args1>, Args1],
    t2: [DSL<Result2, Args2>, Args2],
  ): Promise<[UnpackPromise<Result1>, UnpackPromise<Result2>]>;

  batch<
    Result1 extends FunctionResult,
    Args1 extends FunctionArgs,
    Result2 extends FunctionResult,
    Args2 extends FunctionArgs,
    Result3 extends FunctionResult,
    Args3 extends FunctionArgs
  >(
    t1: [DSL<Result1, Args1>, Args1],
    t2: [DSL<Result2, Args2>, Args2],
    t3: [DSL<Result3, Args3>, Args3],
  ): Promise<
    [UnpackPromise<Result1>, UnpackPromise<Result2>, UnpackPromise<Result3>]
  >;

  request<Result extends FunctionResult, Args extends FunctionArgs>(
    { fileName, methodName }: DSL<Result, Args>,
    ...args: Args
  ): Promise<UnpackPromise<Result>>;
}
