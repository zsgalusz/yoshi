const verifyNodeVersion = require('../src/verifyNodeVersion');
const tempy = require('tempy');
const path = require('path');
const fs = require('fs');

const mockNodeVersion = version => {
  Object.defineProperty(process, 'version', {
    value: version,
  });
};

describe('verifyNodeVersion', () => {
  let tempDir, logSpy;
  const nvmrc = '10';

  beforeEach(() => {
    tempDir = tempy.directory();
    fs.writeFileSync(path.join(tempDir, '.nvmrc'), nvmrc);
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('should detect current node version', () => {
    const node = '1.2.3';
    mockNodeVersion(node);

    verifyNodeVersion(tempDir);

    expect(logSpy).toHaveBeenNthCalledWith(1, `Node ${node} detected!`);
  });

  test('should fail if node version does not match .nvmrc', () => {
    mockNodeVersion('8.7.6');

    expect(verifyNodeVersion(tempDir)).toBe(false);

    expect(logSpy).toHaveBeenNthCalledWith(
      2,
      `Your node version doesn't match ${nvmrc}.\n`,
    );
  });

  test('should pass if node is installed and matches .nvmrc', () => {
    mockNodeVersion('10.10.10');

    expect(verifyNodeVersion(tempDir)).toBe(true);

    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});
