import { JsonValue } from 'type-fest';
import { Fn, Context } from './wrap';

type Options = {
  baseUrl: string;
};

type JsonArgs = Array<JsonValue>;

type JsonResult = Promise<JsonValue>;

type Client = {
  request: <Value extends JsonResult, Args extends JsonArgs>(
    fn: Fn<Context, Args, Value>,
    ...args: Args
  ) => Value;
};

export default function create(options: Options): Client {
  // @ts-ignore
  return options;
}
