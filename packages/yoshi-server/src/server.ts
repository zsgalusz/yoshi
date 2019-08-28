import { RequestListener } from 'http';
import Youch from 'youch';
import globby from 'globby';
import SockJS from 'sockjs-client';
import { send, json } from 'micro';
import importFresh from 'import-fresh';
import serializeError from 'serialize-error';
import config from 'yoshi-config';
import { ROUTES_BUILD_DIR, BUILD_DIR } from 'yoshi-config/paths';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';
import { Request, Response } from 'express';
import { WithAspects } from '@wix/wix-express-aspects';
import { getMatcher, relativeFilePath } from './utils';
import Router, { route, Route } from './router';
import { DSL, FunctionContext } from './types';

type RequiredRecursively<T> = Exclude<
  T extends string | number | boolean | Function | RegExp
    ? T
    : {
        [P in keyof T]-?: T[P] extends Array<infer U>
          ? Array<RequiredRecursively<U>>
          : T[P] extends Array<infer U>
          ? Array<RequiredRecursively<U>>
          : RequiredRecursively<T[P]>;
      },
  null | undefined
>;

type AccessorFunction<T, R> = (object: RequiredRecursively<T>) => R;

function getFrom<T>(object: T) {
  return function<R>(accessorFn: AccessorFunction<T, R>, defaultValue: R): R {
    try {
      const result = accessorFn((object as unknown) as RequiredRecursively<T>);
      return result === undefined || result === null ? defaultValue : result;
    } catch (e) {
      return defaultValue;
    }
  };
}

const clientRequest = t.array(
  t.type({
    fileName: t.string,
    methodName: t.string,
    args: t.array(t.any),
  }),
);

export default class Server {
  private context: any;
  private router: Router;
  private config: { [name: string]: any };

  constructor(context: any) {
    this.context = context;

    this.router = new Router(this.generateRoutes());

    this.config = context.config.load(config.unscopedName);

    // Setup HMR
    if (process.env.NODE_ENV === 'development') {
      const socket = new SockJS(
        `http://localhost:${process.env.HMR_PORT}/_yoshi_server_hmr_`,
      );

      socket.onmessage = async () => {
        try {
          this.router = new Router(this.generateRoutes());
        } catch (error) {
          socket.send(JSON.stringify({ success: false }));
        }

        socket.send(JSON.stringify({ success: true }));
      };
    }
  }

  private generateRoutes(): Array<Route> {
    const functions = this.createFunctions();
    const dynamicRoutes = this.createDynamicRoutes();

    return [
      {
        match: route('/_api_'),
        fn: async (req, res) => {
          const body = await json(req);
          const result = clientRequest.decode(body);

          if (isLeft(result)) {
            return send(res, 406, PathReporter.report(result));
          }

          const fns = [];

          for (const { fileName, methodName, args } of result.right) {
            const get = getFrom(functions);
            const method = get(c => c[fileName][methodName].__fn__, null);

            if (!method) {
              return send(res, 406, 'method not found');
            }

            const fnThis: FunctionContext = {
              context: this.context,
              req: req as Request & WithAspects,
              res: res as Response,
            };

            fns.push(method.bind(fnThis, ...args));
          }

          const results = await Promise.all(fns.map(fn => fn()));

          return send(res, 200, results);
        },
      },
      ...dynamicRoutes,
    ];
  }

  public handle: RequestListener = async (req, res) => {
    try {
      const fn = this.router.match(req, res);

      if (fn) {
        return await fn();
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        return send(res, 500, '500');
      }

      return send(res, 500, serializeError(error));
    }

    return send(res, 404, '404');
  };

  private createDynamicRoutes(): Array<Route> {
    const serverChunks = globby.sync('**/*.js', {
      cwd: ROUTES_BUILD_DIR,
      absolute: true,
    });

    return serverChunks.map(absolutePath => {
      const chunk: any = importFresh(absolutePath);
      const relativePath = `/${relativeFilePath(
        ROUTES_BUILD_DIR,
        absolutePath,
      )}`;
      const match = getMatcher(relativePath);

      return {
        match,
        fn: async (req, res, params) => {
          try {
            const fnThis = {
              context: this.context,
              config: this.config,
              req,
              res,
              params,
            };

            return send(res, 200, await chunk.default.call(fnThis));
          } catch (error) {
            const youch = new Youch(error, req);
            const html: string = await youch.toHTML();

            return send(res, 500, html);
          }
        },
      };
    });
  }

  private createFunctions(): {
    [filename: string]:
      | { [methodName: string]: DSL<any, any> | undefined }
      | undefined;
  } {
    const serverChunks = globby.sync('**/*.api.js', {
      cwd: BUILD_DIR,
      absolute: true,
    });

    return serverChunks.reduce((acc, absolutePath) => {
      const chunk = importFresh(absolutePath);
      const filename = relativeFilePath(BUILD_DIR, absolutePath);

      return {
        ...acc,
        [filename]: chunk,
      };
    }, {});
  }
}
