import { parse as parseUrl, UrlWithParsedQuery } from 'url';
import { RequestListener } from 'http';
import Youch from 'youch';
import SockJS from 'sockjs-client';
import serializeError from 'serialize-error';
import { send, json } from 'micro';
import createRoutes from './createRoutes';
import createFunctions from './createFunctions';

async function createRouter() {
  const routes = await createRoutes();

  return function match(parsedUrl: UrlWithParsedQuery) {
    for (const route of routes) {
      const params = route.match(parsedUrl.pathname);

      if (params) {
        return {
          route,
          params,
        };
      }
    }
  };
}

async function createInvoker() {
  const functions = await createFunctions();

  return function invoke(fileName: string, methodName: string) {
    for (const fn of functions) {
      if (fn.filename === fileName) {
        return fn.chunk[methodName];
      }
    }
  };
}

const socket = new SockJS(
  `http://localhost:${process.env.HMR_PORT}/_yoshi_server_hmr_`,
);

export default async (context: any): Promise<RequestListener> => {
  let match = await createRouter();
  let invoke = await createInvoker();

  // Hot reload
  socket.onmessage = async () => {
    try {
      match = await createRouter();
      invoke = await createInvoker();
    } catch (error) {
      socket.send(JSON.stringify({ success: false }));
    }
    socket.send(JSON.stringify({ success: true }));
  };

  // Return handler
  return async (req, res) => {
    const parsedUrl = parseUrl(req.url as string, true);

    // Server function endpoint
    if (parsedUrl.pathname === '/_api_') {
      if (req.method !== 'POST') {
        return send(res, 400);
      }

      const { methodName, fileName, args } = await json(req);
      const { __fn__ } = invoke(fileName, methodName);

      let result;

      try {
        result = await __fn__.call({ context, req, res }, args);
      } catch (error) {
        return send(res, 500, serializeError(error));
      }

      return send(res, 200, result);
    }

    // Try to match a route
    try {
      const matched = match(parsedUrl);

      if (matched) {
        return send(res, 200, await matched.route.fn());
      }
    } catch (error) {
      // Handle errors
      const youch = new Youch(error, req);
      const html: string = await youch.toHTML();

      return send(res, 500, html);
    }

    // No route was found
    await send(res, 404, '404');
  };
};
