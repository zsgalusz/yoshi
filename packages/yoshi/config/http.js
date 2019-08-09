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
  const fileName = path.basename(this.resourcePath).replace(/\.(js|ts)$/, '');
  const functions = getExports(source).map(methodName => {
    return `export const ${methodName} = { methodName: '${methodName}', fileName: '${fileName}' };`;
  });

  return functions.join('\n\n');
};
