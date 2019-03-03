const fs = require('fs');
const path = require('path');
const { initTest, waitForPort, waitForPortToFree } = require('../../../utils');

jest.setTimeout(20 * 1000);

const clientFilePath = path.join(
  process.env.TEST_DIRECTORY,
  'src/components/features/css-inclusion.tsx',
);

const serverFilePath = path.join(process.env.TEST_DIRECTORY, 'src/server.tsx');

const originalServerContent = fs.readFileSync(serverFilePath, 'utf-8');

describe('hmr', () => {
  describe('client side', () => {
    it('reloads the browser on javascript changes', async () => {
      console.log('111');

      await initTest('css-inclusion');

      console.log('222');

      expect(await page.$eval('#css-inclusion', elm => elm.textContent)).toBe(
        'CSS Modules are working!',
      );

      console.log('333');

      const originalContent = fs.readFileSync(clientFilePath, 'utf-8');

      const editedContent = originalContent.replace(
        'CSS Modules are working!',
        'Overridden content!',
      );

      fs.writeFileSync(clientFilePath, editedContent);

      console.log('444');

      await page.waitForNavigation();

      console.log('555');

      expect(await page.$eval('#css-inclusion', elm => elm.textContent)).toBe(
        'Overridden content!',
      );

      fs.writeFileSync(clientFilePath, originalContent);

      console.log('666');

      await page.waitForNavigation();

      console.log('777');

      expect(await page.$eval('#css-inclusion', elm => elm.textContent)).toBe(
        'CSS Modules are working!',
      );

      console.log('888');
    });
  });

  describe.skip('server side', () => {
    afterEach(async () => {
      fs.writeFileSync(serverFilePath, originalServerContent);

      await waitForPort(process.env.PORT);

      await page.waitForNavigation();

      expect(await page.title()).toBe('Some title');
    });

    it('reloads server on changes and reloads the browser', async () => {
      await initTest('css-inclusion');

      expect(await page.title()).toBe('Some title');

      fs.writeFileSync(
        serverFilePath,
        originalServerContent.replace('Some title', 'Overridden title!'),
      );

      await page.waitForNavigation();

      expect(await page.title()).toBe('Overridden title!');
    });

    it('shows error overlay on the browser', async () => {
      await initTest('css-inclusion');

      expect(await page.title()).toBe('Some title');

      fs.writeFileSync(serverFilePath, '<<< error');

      await page.waitForSelector('#webpack-dev-server-client-overlay');
    });

    it('restarts server if it dies', async () => {
      await initTest('css-inclusion');

      expect(await page.title()).toBe('Some title');

      fs.writeFileSync(serverFilePath, 'process.exit(1);');

      await waitForPortToFree(process.env.PORT);
    });
  });
});
