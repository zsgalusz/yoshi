import { transform } from './transform-utils';

export = {
  process(source: string, fullFileName: string) {
    return transform(source, fullFileName);
  },
};
