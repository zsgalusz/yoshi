import unfetch from 'isomorphic-unfetch';
import { FunctionArgs, FunctionResult, UnpackPromise, DSL } from '../types';
import { joinUrls } from './utils';
import { HttpClient } from './interface';

type Options = {
  baseUrl?: string;
};

// https://github.com/developit/unfetch/issues/46
const fetch = unfetch;

export default class implements HttpClient {
  private baseUrl: string;

  constructor({ baseUrl = '/' }: Options = {}) {
    this.baseUrl = baseUrl;
  }

  batch<Result1 extends FunctionResult, Args1 extends FunctionArgs>(
    t1: [DSL<Result1, Args1>, Args1],
  ): Promise<[UnpackPromise<Result1>]>;

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

  async batch(...ts: Array<[DSL<any, any>, FunctionArgs]>) {
    const url = joinUrls(this.baseUrl, '/_api_');

    const data = ts.map(([{ fileName, methodName }, args]) => {
      return { fileName, methodName, args };
    });

    const res = await fetch(url, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();

      if (process.env.NODE_ENV !== 'production') {
        console.log(error);
      }

      throw new Error(JSON.stringify(error));
    }

    return res.json();
  }

  async request<Result extends FunctionResult, Args extends FunctionArgs>(
    dsl: DSL<Result, Args>,
    ...args: Args
  ): Promise<UnpackPromise<Result>> {
    return this.batch([dsl, args]).then(([result]) => result);
  }
}
