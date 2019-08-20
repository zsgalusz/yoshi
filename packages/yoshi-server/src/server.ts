import { parse as parseUrl } from 'url';
import { RequestListener } from 'http';
import Youch from 'youch';
import SockJS from 'sockjs-client';
import serializeError from 'serialize-error';
import { send, json } from 'micro';
import createRoutes from './createRoutes';
import createFunctions from './createFunctions';

const socket = new SockJS(
  `http://localhost:${process.env.HMR_PORT}/_yoshi_server_hmr_`,
);

export default async (context: any): Promise<RequestListener> => {
  let matchRoute = await createRoutes();
  let matchFunction = await createFunctions();

  // Hot reload
  socket.onmessage = async () => {
    try {
      matchRoute = await createRoutes();
      matchFunction = await createFunctions();
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

      try {
        const matched = matchFunction(fileName, methodName);

        if (matched) {
          const fnThis = { context, req, res };
          const result = await matched.__fn__.call(fnThis, args);

          return send(res, 200, result);
        }
      } catch (error) {
        return send(res, 500, serializeError(error));
      }

      return send(res, 400);
    }

    // Try to match a route
    try {
      const matched = matchRoute(parsedUrl);

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
