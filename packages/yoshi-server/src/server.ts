import { RequestListener } from 'http';
import path from 'path';
import Youch from 'youch';
import SockJS from 'sockjs-client';
import serializeError from 'serialize-error';
import { send, json } from 'micro';
import globby from 'globby';
import importFresh from 'import-fresh';
import { ROUTES_BUILD_DIR, BUILD_DIR } from 'yoshi-config/paths';
import { getMatcher } from './utils';
import Router, { route, Route } from './router';

export default class Server {
  private context: any;
  private socket: WebSocket;
  private router: Router;

  constructor(context: any) {
    this.context = context;

    this.socket = new SockJS(
      `http://localhost:${process.env.HMR_PORT}/_yoshi_server_hmr_`,
    );

    this.router = new Router(this.generateRoutes());

    this.socket.onmessage = async () => {
      try {
        this.router = new Router(this.generateRoutes());
      } catch (error) {
        this.socket.send(JSON.stringify({ success: false }));
      }

      this.socket.send(JSON.stringify({ success: true }));
    };
  }

  private generateRoutes(): Array<Route> {
    const functions = this.createFunctions();
    const dynamicRoutes = this.createDynamicRoutes();

    return [
      {
        match: route('/_api_'),
        fn: async (req, res) => {
          const { methodName, fileName, args } = await json(req);

          try {
            const matched = functions[fileName][methodName];

            if (matched) {
              const fnThis = { context: this.context, req, res };
              const result = await matched.__fn__.call(fnThis, args);

              return send(res, 200, result);
            }
          } catch (error) {
            return send(res, 500, serializeError(error));
          }

          return send(res, 400);
        },
      },
      {
        match: route('/_batch_'),
        fn: async (req, res) => {
          const data = await json(req);

          try {
            const results: any = await Promise.all(
              data.map(async ({ fileName, methodName, args }: any) => {
                const matched = functions[fileName][methodName];

                if (matched) {
                  const fnThis = { context: this.context, req, res };
                  const result = await matched.__fn__.call(fnThis, args);

                  return result;
                }
              }),
            );

            return send(res, 200, results);
          } catch (error) {
            return send(res, 500, serializeError(error));
          }
        },
      },
      ...dynamicRoutes,
    ];
  }

  public handle: RequestListener = async (req, res) => {
    const match = this.router.match(req, res);

    if (match) {
      return match();
    }

    await send(res, 404, '404');
  };

  private createDynamicRoutes(): Array<Route> {
    const serverChunks = globby.sync('**/*.js', {
      cwd: ROUTES_BUILD_DIR,
      absolute: true,
    });

    return serverChunks.map(absolutePath => {
      const chunk: any = importFresh(absolutePath);

      const relativePath = `/${path.relative(
        ROUTES_BUILD_DIR,
        absolutePath.replace(/\.[^/.]+$/, ''),
      )}`;

      const match = getMatcher(relativePath);

      return {
        match,
        fn: async (req, res) => {
          try {
            return send(res, 200, await chunk.default());
          } catch (error) {
            // Handle errors
            const youch = new Youch(error, req);
            const html: string = await youch.toHTML();

            return send(res, 500, html);
          }
        },
      };
    });
  }

  private createFunctions(): { [filename: string]: any } {
    const serverChunks = globby.sync('**/*.api.js', {
      cwd: BUILD_DIR,
      absolute: true,
    });

    return serverChunks.reduce((acc, absolutePath) => {
      const chunk: any = importFresh(absolutePath);
      const filename = path.relative(
        BUILD_DIR,
        absolutePath.replace(/\.[^/.]+$/, ''),
      );

      return {
        ...acc,
        [filename]: chunk,
      };
    }, {});
  }
}
