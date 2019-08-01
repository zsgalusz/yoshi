import babelJest from 'babel-jest';
import { createBabelConfig } from 'yoshi-helpers/utils';

const babelConfig = createBabelConfig();

export = babelJest.createTransformer(babelConfig);
