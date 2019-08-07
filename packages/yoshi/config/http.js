const traverse = require('@babel/traverse').default;
const { parse } = require('@babel/parser');

function getExports(source) {
  const exportedNames = [];
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript'] });

  traverse(ast, {
    ExportNamedDeclaration({ node }) {
      exportedNames.push(node.declaration.declarations[0].id.name);
    },
  });

  return exportedNames;
}

const path = require('path');

module.exports = function(source) {
  // const { endpoint } = getOptions(this);
  const endpoint = '/_api_';
  const parser = require.resolve('./fetcher');

  this.addDependency(parser);

  const fileName = path.basename(this.resourcePath).replace(/\.(js|ts)$/, '');

  const headers = [
    `import { httpFunctionsFetcher } from '${parser}';`,
    `var fetcher = httpFunctionsFetcher.bind(null, '${endpoint}', '${fileName}')`,
  ];

  const functions = getExports(source).map(fn => {
    return `export const ${fn} = fetcher('${fn}');`;
  });

  return [...headers, ...functions].join('\n\n');
};
