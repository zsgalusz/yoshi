import path from 'path';

export = {
  process(src: string, filename: string) {
    const assetFilename = JSON.stringify(path.basename(filename));

    if (filename.match(/\.svg$/)) {
      return `const React = require('react');
        module.exports = {
        __esModule: true,
        default: ${assetFilename},
        ReactComponent: (props) => ({
          $$typeof: Symbol.for('react.element'),
          type: 'svg',
          ref: null,
          key: null,
          props: Object.assign({}, props, {
            children: ${assetFilename}
          })
        }),
      };`;
    }

    return `module.exports = ${assetFilename};`;
  },
};
