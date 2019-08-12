import path from 'path';
import { parse as parseUrl, UrlWithParsedQuery } from 'url';
import { RequestListener } from 'http';
import globby from 'globby';
import Youch from 'youch';
import importFresh from 'import-fresh';
import { ROUTES_BUILD_DIR, API_BUILD_DIR } from 'yoshi-config/paths';
import SockJS from 'sockjs-client';
import serializeError from 'serialize-error';
import { send } from 'micro';
import createRoutes from './createRoutes';

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

const socket = new SockJS(
  `http://localhost:${process.env.HMR_PORT}/_yoshi_server_hmr_`,
);

export default async (context: any): Promise<RequestListener> => {
  let match = await createRouter();

  socket.onmessage = async () => {
    try {
      match = await createRouter();
    } catch (error) {
      socket.send(JSON.stringify({ success: false }));
    }
    socket.send(JSON.stringify({ success: true }));
  };

  return async (req, res) => {
    const parsedUrl = parseUrl(req.url as string, true);

    try {
      const matched = match(parsedUrl);

      if (matched) {
        return send(res, 200, await matched.route.fn());
      }
    } catch (error) {
      const youch = new Youch(error, req);
      const html: string = await youch.toHTML();

      return send(res, 500, html);
    }

    await send(res, 404, '404');
  };
};

async function createFunctions() {
  const serverChunks = await globby('**/*.js', {
    cwd: API_BUILD_DIR,
    absolute: true,
  });

  return Promise.all(
    serverChunks.map(async absolutePath => {
      const chunk: any = importFresh(absolutePath);

      return {
        fn: chunk,
        filename: path.relative(
          API_BUILD_DIR,
          absolutePath.replace(/\.[^/.]+$/, ''),
        ),
      };
    }),
  );
}

// export default async (context: any): Promise<RequestHandler> => {
//   const projectConfig = context.config.load(config.unscopedName);

//   let [routes, functions] = await Promise.all([
//     createRoutes(),
//     createFunctions(),
//   ]);

//   socket.onmessage = async () => {
//     try {
//       const [newRoutes, newFunctions] = await Promise.all([
//         createRoutes(),
//         createFunctions(),
//       ]);

//       routes = newRoutes;
//       functions = newFunctions;
//     } catch (error) {
//       socket.send(JSON.stringify({ success: false }));
//     }
//     socket.send(JSON.stringify({ success: true }));
//   };

//   return async (req, res) => {
//     if (req.path === '/_server_functions_') {
//       const chunk = functions.find(c => c.filename === req.body.fileName);

//       if (chunk) {
//         try {
//           return res.json(
//             await chunk.fn[req.body.methodName](...req.body.args),
//           );
//         } catch (error) {
//           return res.status(500).json(serializeError(error));
//         }
//       }
//     }

//     if (req.path === '/_server_functions_batch_') {
//       const results = req.body.data.map(async (data: any) => {
//         const chunk = functions.find(c => c.filename === data.fileName);

//         if (chunk) {
//           try {
//             return chunk.fn[data.methodName](...data.args);
//           } catch (error) {
//             return res.status(500).json(serializeError(error));
//           }
//         }
//       });

//       return res.json(await Promise.all(results));
//     }

//     const route = routes.find(({ match }) => {
//       return match(req.path);
//     });

//     if (!route) {
//       return res.status(404).send('404');
//     }

//     try {
//       const params = route.match(req.path);
//       const result = await route.fn.call(
//         {
//           req,
//           res,
//           projectConfig,
//         },
//         params,
//       );

//       if (typeof result === 'object') {
//         res.json(result);
//       } else if (isString(result)) {
//         res.send(result);
//       }
//     } catch (error) {
//       const youch = new Youch(error, req);

//       youch.toHTML().then((html: string) => {
//         res.writeHead(200, { 'content-type': 'text/html' });
//         res.write(html);
//         res.end();
//       });
//     }
//   };
// };
