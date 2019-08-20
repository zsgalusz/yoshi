import path from 'path';
import { UrlWithParsedQuery } from 'url';
import globby from 'globby';
import importFresh from 'import-fresh';
import { ROUTES_BUILD_DIR } from 'yoshi-config/paths';
import { getMatcher } from './utils';

export default async function createRouter() {
  const serverChunks = await globby('**/*.js', {
    cwd: ROUTES_BUILD_DIR,
    absolute: true,
  });

  const routes = await Promise.all(
    serverChunks.map(async absolutePath => {
      const chunk: any = importFresh(absolutePath);

      const relativePath = `/${path.relative(
        ROUTES_BUILD_DIR,
        absolutePath.replace(/\.[^/.]+$/, ''),
      )}`;

      const match = getMatcher(relativePath);

      return {
        match,
        fn: chunk.default,
      };
    }),
  );

  return (parsedUrl: UrlWithParsedQuery) => {
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
