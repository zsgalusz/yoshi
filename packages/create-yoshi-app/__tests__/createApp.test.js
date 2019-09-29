const tempy = require('tempy');
const createApp = require('../src/createApp');
const execa = require('execa');
const TemplateModel = require('../src/TemplateModel');
const path = require('path');
const { gitInit } = require('../src/utils');
const fs = require('fs-extra');

jest.mock('../src/runPrompt');
jest.mock('../src/verifyRegistry');
jest.mock('../src/verifyNodeVersion');
jest.mock('../src/utils');

const consoleLog = console.log;

describe('createApp', () => {
  beforeEach(() => {
    // mock console.log to reduce noise from the tests
    console.log = jest.fn();

    require('../src/runPrompt').mockReturnValue(minimalTemplateModel());

    require('../src/utils').isInsideGitRepo.mockImplementation(
      jest.requireActual('../src/utils').isInsideGitRepo,
    );

    require('../src/utils').gitInit.mockImplementation(
      jest.requireActual('../src/utils').gitInit,
    );

    require('../src/verifyRegistry').mockReturnValue(undefined);
  });

  afterEach(() => {
    console.log = consoleLog;
    jest.clearAllMocks();
  });

  test('it should generate a git repo', async () => {
    const tempDir = tempy.directory();
    await createApp({ workingDir: tempDir, install: false, lint: false });

    expect(() => {
      console.log('Checking git status...');
      execa.shellSync('git status', {
        cwd: tempDir,
      });
    }).not.toThrow();
  });

  test('it should not create a git repo if the target directory is contained in a git repo', async () => {
    const tempDir = tempy.directory();
    const projectDir = path.join(tempDir, 'project');

    gitInit(tempDir);
    fs.ensureDirSync(projectDir);
    await createApp({ workingDir: projectDir, install: false, lint: false });

    expect(() => fs.statSync(path.join(projectDir, '.git'))).toThrow();
  });

  test('it uses a template model', async () => {
    const templateModel = minimalTemplateModel();

    const tempDir = tempy.directory();
    const projectDir = path.join(tempDir, 'project');

    fs.ensureDirSync(projectDir);

    await createApp({
      workingDir: projectDir,
      templateModel,
      install: false,
      lint: false,
    });

    const packageJson = fs.readJSONSync(
      path.join(tempDir, 'project', 'package.json'),
    );
    expect(packageJson.name).toBe('minimal-template');
  });

  test('it should install dependencies and run lint fix', async () => {
    const tempDir = tempy.directory();
    require('../src/verifyNodeVersion').mockReturnValue(true);
    const { hasNode } = await createApp({
      workingDir: tempDir,
    });

    expect(hasNode).toBe(true);
    expect(require('../src/utils').npmInstall).toHaveBeenCalledWith(tempDir);
    expect(require('../src/utils').lintFix).toHaveBeenCalledWith(tempDir);
  });

  test('it should not install dependencies and run lint fix if node version does not match .nvmrc', async () => {
    const tempDir = tempy.directory();
    require('../src/verifyNodeVersion').mockReturnValue(false);

    const { hasNode } = await createApp({
      workingDir: tempDir,
    });

    expect(hasNode).toBe(false);
    expect(require('../src/utils').npmInstall).not.toHaveBeenCalled();
    expect(require('../src/utils').lintFix).not.toHaveBeenCalled();
  });
});

function minimalTemplateModel() {
  return TemplateModel.fromJSON({
    projectName: `test-project`,
    authorName: 'rany',
    authorEmail: 'rany@wix.com',
    transpiler: 'babel',
    templateDefinition: {
      name: 'minimal-template',
      path: path.join(__dirname, './__fixtures__/minimal-template/'),
    },
  });
}
