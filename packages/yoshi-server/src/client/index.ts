import unfetch from 'isomorphic-unfetch';
import { FunctionArgs, FunctionResult, UnpackPromise, DSL } from '../types';
import { joinUrls } from './utils';

type Options = {
  baseUrl?: string;
};

// https://github.com/developit/unfetch/issues/46
const fetch = unfetch;

export default class HttpClient {
  private baseUrl: string;

  constructor({ baseUrl = '/' }: Options = {}) {
    this.baseUrl = baseUrl;
  }

  async batch<
    Result1 extends FunctionResult,
    Args1 extends FunctionArgs,
    Result2 extends FunctionResult,
    Args2 extends FunctionArgs
  >(
    t1: [DSL<Args1, Result1>, Args1],
    t2: [DSL<Args2, Result2>, Args2],
  ): Promise<[UnpackPromise<Result1>, UnpackPromise<Result2>]>;

  async batch<
    Result1 extends FunctionResult,
    Args1 extends FunctionArgs,
    Result2 extends FunctionResult,
    Args2 extends FunctionArgs,
    Result3 extends FunctionResult,
    Args3 extends FunctionArgs
  >(
    t1: [DSL<Args1, Result1>, Args1],
    t2: [DSL<Args2, Result2>, Args2],
    t3: [DSL<Args3, Result3>, Args3],
  ): Promise<
    [UnpackPromise<Result1>, UnpackPromise<Result2>, UnpackPromise<Result3>]
  >;

  async batch(...ts: Array<[DSL<any, any>, FunctionArgs]>) {
    const url = joinUrls(this.baseUrl, '/_batch_');

    const data = ts.map(([{ fileName, methodName }, args]) => {
      return { fileName, methodName, args };
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(JSON.stringify(await res.json()));
    }

    return res.json();
  }

  async request<Result extends FunctionResult, Args extends FunctionArgs>(
    { fileName, methodName }: DSL<Args, Result>,
    ...args: Args
  ): Promise<UnpackPromise<Result>> {
    const url = joinUrls(this.baseUrl, '/_api_');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        methodName,
        args,
      }),
    });

    if (!res.ok) {
      throw new Error(JSON.stringify(await res.json()));
    }

    return res.json();
  }
}
