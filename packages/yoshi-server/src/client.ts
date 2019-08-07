import { JsonValue } from 'type-fest';
import { Fn } from './wrap';

type Options = {
  baseUrl: string;
};

export default function create<
  F extends { [key: string]: Fn<any, Array<JsonValue>, Promise<JsonValue>> }
>(obj: F, options: Options): F {
  return obj;
}
