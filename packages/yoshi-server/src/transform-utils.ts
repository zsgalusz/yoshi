import path from 'path';
import { SRC_DIR } from 'yoshi-config/paths';
import traverse from '@babel/traverse';
import { parse } from '@babel/parser';

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

export function transform(source: string, fullFileName: string) {
  const fileName = path
    .relative(SRC_DIR, fullFileName)
    .replace(/\.(js|ts)$/, '');

  const functions = collectExportNames(source as string).map(functionName => {
    return `export const ${functionName} = { functionName: '${functionName}', fileName: '${fileName}' };`;
  });

  return functions.join('\n\n');
}
