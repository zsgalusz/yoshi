import { parse as parseUrl } from 'url';
import { Request, Response } from 'express';
import pathToRegexp from 'path-to-regexp';

export const route = pathMatch();

export type Params = { [param: string]: any };

export type RouteMatch = (pathname: string) => false | Params;

export type Route = {
  match: RouteMatch;
  fn: (req: Request, res: Response, params: Params) => void;
};

export default class Router {
  private routes: Array<Route>;

  constructor(routes: Array<Route> = []) {
    this.routes = routes;
  }

  match(req: Request, res: Response) {
    const { pathname } = parseUrl(req.url as string, true);

    for (const { match, fn } of this.routes) {
      const params = match(pathname as string);

      if (params) {
        return () => fn(req, res, params);
      }
    }
  }
}

function pathMatch() {
  return (path: string) => {
    const keys: Array<any> = [];
    const re = pathToRegexp(path, keys, {});

    return (pathname: string | undefined) => {
      const m = re.exec(pathname as string);

      if (!m) return false;

      const params: Params = {};

      let key;
      let param;
      for (let i = 0; i < keys.length; i++) {
        key = keys[i];
        param = m[i + 1];
        if (!param) continue;
        params[key.name] = decodeParam(param);
        if (key.repeat)
          params[key.name] = params[key.name].split(key.delimiter);
      }

      return params;
    };
  };
}

function decodeParam(param: string) {
  try {
    return decodeURIComponent(param);
  } catch (_) {
    const err = new Error('failed to decode param');
    // @ts-ignore DECODE_FAILED is handled
    err.code = 'DECODE_FAILED';
    throw err;
  }
}
