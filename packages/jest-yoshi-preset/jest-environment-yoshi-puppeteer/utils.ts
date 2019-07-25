import globby from 'globby';
import globs from 'yoshi-config/globs';

const { MATCH_ENV } = process.env;

export async function shouldRunE2Es() {
  const filesPaths = await globby(globs.e2eTests, { gitignore: true });

  return (
    filesPaths.length > 0 &&
    (!MATCH_ENV || MATCH_ENV.split(',').includes('e2e'))
  );
}
