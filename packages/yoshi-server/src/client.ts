import { JsonValue } from 'type-fest';
import { chunk } from 'lodash';
import { Fn, OptionalPromise } from './wrap';

type Options = {
  baseUrl?: string;
};

type JsonArgs = Array<JsonValue>;

type JsonResult = OptionalPromise<JsonValue>;

type Unpacked<T> = T extends Promise<infer U> ? U : T;

class HttpClient {
  private baseUrl: string;

  constructor({ baseUrl = '/' } = {}) {
    this.baseUrl = baseUrl;
  }

  async request<Value extends JsonResult, Args extends JsonArgs>(
    data: Fn<Args, Value>,
    ...args: Args
  ): Promise<Unpacked<Value>> {
    const res = await fetch('/_server_functions_', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        args,
      }),
    });

    const json = await res.json();

    if (res.status === 500) {
      console.log(json);
    }

    return json;
  }

  async batch<
    V1 extends JsonResult,
    A1 extends JsonArgs,
    V2 extends JsonResult,
    A2 extends JsonArgs
  >(
    d1: Fn<A1, V1>,
    a1: A1,
    d2: Fn<A2, V2>,
    a2: A2,
  ): Promise<[Unpacked<V1>, Unpacked<V2>]>;

  async batch<
    V1 extends JsonResult,
    A1 extends JsonArgs,
    V2 extends JsonResult,
    A2 extends JsonArgs,
    V3 extends JsonResult,
    A3 extends JsonArgs
  >(
    d1: Fn<A1, V1>,
    a1: A1,
    d2: Fn<A2, V2>,
    a2: A2,
    d3: Fn<A3, V3>,
    a3: A3,
  ): Promise<[Unpacked<V1>, Unpacked<V2>, Unpacked<V3>]>;

  async batch(...args: Array<any>) {
    const data = chunk(args, 2).map(([fnData, fnArgs]) => {
      return {
        ...fnData,
        args: fnArgs,
      };
    });

    const res = await fetch('/_server_functions_batch_', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
      }),
    });

    const json = await res.json();

    if (res.status === 500) {
      console.log(json);
    }

    return json;
  }
}

export function create(options?: Options) {
  return new HttpClient(options);
}
