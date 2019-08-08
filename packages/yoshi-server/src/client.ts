import { JsonValue } from 'type-fest';
import { Fn, OptionalPromise } from './wrap';

type Options = {
  baseUrl: string;
};

type JsonArgs = Array<JsonValue>;

type JsonResult = OptionalPromise<JsonValue>;

type Unpacked<T> = T extends Promise<infer U> ? U : T;

type Client = {
  request: <Value extends JsonResult, Args extends JsonArgs>(
    fn: Fn<Args, Value>,
    ...args: Args
  ) => Promise<Unpacked<Value>>;

  batch: <
    V1 extends JsonResult,
    A1 extends JsonArgs,
    V2 extends JsonResult,
    A2 extends JsonArgs
  >(
    a: [Fn<A1, V1>, A1],
    b: [Fn<A2, V2>, A2],
  ) => Promise<[Unpacked<V1>, Unpacked<V2>]>;
};

export default function create(options: Options): Client {
  // @ts-ignore
  return options;
}
