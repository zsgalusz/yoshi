import { parse as parseUrl } from 'url';
import { Request, Response } from 'express';
import pathToRegexp from 'path-to-regexp';

export type Params = { [param: string]: any };

export type Handler = (req: Request, res: Response, params: Params) => void;

export type Route = {
  route: string;
  handler: Handler;
};

export default class Router {
  private routes: Array<Route>;

  constructor() {
    this.routes = [];
  }

  add(route: string, handler: Handler) {
    this.routes.push({ route, handler });
  }

  match(req: Request, res: Response) {
    const { pathname } = parseUrl(req.url as string, true);

    for (const { handler, route } of this.routes) {
      const params = pathMatch(route, pathname as string);

      if (params) {
        return () => handler(req, res, params);
      }
    }
  }
}

function pathMatch(route: string, pathname: string | undefined) {
  const keys: Array<any> = [];
  const regex = pathToRegexp(route, keys, {});

  const match = regex.exec(pathname as string);

  if (!match) {
    return false;
  }

  return keys.reduce((acc, key, index) => {
    const param = match[index + 1];

    if (!param) {
      return acc;
    }

    const value = decodeURIComponent(param);

    return {
      ...acc,
      [key.name]: key.repeat ? value.split(key.delimiter) : value,
    };
  }, {});
}
