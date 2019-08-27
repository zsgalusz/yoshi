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

  async batch(...ts: Array<[DSL<any, any>, FunctionArgs]>) {
    const url = joinUrls(this.baseUrl, '/_batch_');

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
    { fileName, methodName }: DSL<Result, Args>,
    ...args: Args
  ): Promise<UnpackPromise<Result>> {
    const url = joinUrls(this.baseUrl, '/_api_');

    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
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
      const error = await res.json();

      if (process.env.NODE_ENV !== 'production') {
        console.log(error);
      }

      throw new Error(JSON.stringify(error));
    }

    return res.json();
  }
}
