import { appDriver } from './drivers/app.driver';

describe('React application', () => {
  let driver;

  beforeEach(() => {
    driver = appDriver();
  });

  it('should display title', async () => {
    await driver.navigateToApp();

    expect(await driver.getAppTitleText()).toEqual('Hello World!');
  });
});
