import path from 'path';
import { isString } from 'util';
import globby from 'globby';
import Youch from 'youch';
import { RequestHandler } from 'express';
import config from 'yoshi-config';
import importFresh from 'import-fresh';
import { API_BUILD_DIR } from 'yoshi-config/paths';
import SockJS from 'sockjs-client';
import { getMatcher } from './utils';

async function createRoutes() {
  const serverChunks = await globby('**/*.js', {
    cwd: API_BUILD_DIR,
    absolute: true,
  });

  return Promise.all(
    serverChunks.map(async absolutePath => {
      const chunk: any = importFresh(absolutePath);

      const relativePath = `/${path.relative(
        API_BUILD_DIR,
        absolutePath.replace(/\.[^/.]+$/, ''),
      )}`;

      const match = getMatcher(relativePath);

      return {
        match,
        relativePath,
        fn: chunk,
      };
    }),
  );
}

const socket = new SockJS(
  `http://localhost:${process.env.HMR_PORT}/_yoshi_server_hmr_`,
);

export default async (context: any): Promise<RequestHandler> => {
  const projectConfig = context.config.load(config.unscopedName);

  let routes = await createRoutes();

  socket.onmessage = async () => {
    try {
      routes = await createRoutes();
    } catch (error) {
      socket.send(JSON.stringify({ success: false }));
    }
    socket.send(JSON.stringify({ success: true }));
  };

  return async (req, res) => {
    const route = routes.find(({ match }) => {
      return match(req.path);
    });

    if (!route) {
      return res.status(404).send('404');
    }

    // @ts-ignore
    const petri = context.petri.client(req.aspects);
    const experiments = await petri.conductAllInScope(config.unscopedName);

    try {
      const params = route.match(req.path);
      const result = await route.fn(req, res, {
        params,
        experiments,
        projectConfig,
      });

      if (typeof result === 'object') {
        res.json(result);
      } else if (isString(result)) {
        res.send(result);
      }
    } catch (error) {
      const youch = new Youch(error, req);

      youch.toHTML().then((html: string) => {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.write(html);
        res.end();
      });
    }
  };
};
