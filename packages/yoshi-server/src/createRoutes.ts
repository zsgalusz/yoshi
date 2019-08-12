import path from 'path';
import globby from 'globby';
import importFresh from 'import-fresh';
import { ROUTES_BUILD_DIR } from 'yoshi-config/paths';
import { getMatcher } from './utils';

export default async function createRoutes() {
  const serverChunks = await globby('**/*.js', {
    cwd: ROUTES_BUILD_DIR,
    absolute: true,
  });

  return Promise.all(
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
}
