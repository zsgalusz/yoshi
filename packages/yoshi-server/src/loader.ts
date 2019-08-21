import path from 'path';
import traverse from '@babel/traverse';
import { parse } from '@babel/parser';
// eslint-disable-next-line import/no-unresolved
import { loader } from 'webpack';

function collectExportNames(source: string) {
  const exportedNames: Array<string> = [];
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript'] });

  traverse(ast, {
    ExportNamedDeclaration({ node }) {
      if (node.declaration) {
        if (node.declaration.type === 'VariableDeclaration') {
          const declaration = node.declaration.declarations[0];

          if (declaration.id.type === 'Identifier') {
            exportedNames.push(declaration.id.name);
          }
        }
      }
    },
  });

  return exportedNames;
}

const serverFunctionLoader: loader.Loader = function(source) {
  const fileName = path.basename(this.resourcePath).replace(/\.(js|ts)$/, '');
  const functions = collectExportNames(source as string).map(methodName => {
    return `export const ${methodName} = { methodName: '${methodName}', fileName: '${fileName}' };`;
  });

  return functions.join('\n\n');
};

export default serverFunctionLoader;
