import path from 'path';
import globby from 'globby';
import importFresh from 'import-fresh';
import { BUILD_DIR } from 'yoshi-config/paths';

export default async function createInvoker() {
  const serverChunks = await globby('**/*.api.js', {
    cwd: BUILD_DIR,
    absolute: true,
  });

  const functions = await Promise.all(
    serverChunks.map(async absolutePath => {
      const chunk: any = importFresh(absolutePath);

      return {
        chunk,
        filename: path.relative(
          BUILD_DIR,
          absolutePath.replace(/\.[^/.]+$/, ''),
        ),
      };
    }),
  );

  return (fileName: string, methodName: string) => {
    for (const fn of functions) {
      if (fn.filename === fileName) {
        return fn.chunk[methodName];
      }
    }
  };
}
