// eslint-disable-next-line import/no-unresolved
import { loader } from 'webpack';
import { transform } from './transform-utils';

const serverFunctionLoader: loader.Loader = function(source) {
  return transform(source as string, this.resourcePath);
};

export default serverFunctionLoader;
