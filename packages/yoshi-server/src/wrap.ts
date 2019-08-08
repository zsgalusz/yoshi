import { Request, Response } from 'express';
import { JsonValue } from 'type-fest';
import { WithAspects } from '@wix/wix-express-aspects';
import Config from '@wix/wix-config';
import { PetriClientFactory } from '@wix/wix-petri-client';

export type Context = {
  req: Request & WithAspects;
  res: Response;
  context: {
    config: Config;
    petri: PetriClientFactory;
  };
};

type JsonArgs = Array<JsonValue>;

type JsonResult = Promise<JsonValue>;

export type Fn<Context, Args extends JsonArgs, Result extends JsonResult> = (
  this: Context,
  ...args: Args
) => Result;

export function wrap<Value extends JsonResult, Args extends JsonArgs>(
  fn: Fn<Context, Args, Value>,
): Fn<Context, Args, Value> {
  // @ts-ignore
  return fn;
}
