const path = require('path');
const Answers = require('../src/Answers');

describe('Answers', () => {
  describe('transpiler is babel', () => {
    const answers = new Answers({
      templateDefinition: {
        name: 'client',
        path: path.join(__dirname, '../templates/client'),
      },
      transpiler: 'babel',
    });

    it('should compute the templatePath according to the projectType and the transpiler', () => {
      expect(answers.templatePath).toBe(
        path.join(__dirname, '../templates/client/javascript'),
      );
    });
  });

  describe('transpiler is typescript', () => {
    const answers = new Answers({
      templateDefinition: {
        name: 'client',
        path: path.join(__dirname, '../templates/client'),
      },
      transpiler: 'typescript',
    });

    it('should compute the proper templatePath according to the projectType and the transpiler', () => {
      expect(answers.templatePath).toBe(
        path.join(__dirname, '../templates/client/typescript'),
      );
    });
  });
});
