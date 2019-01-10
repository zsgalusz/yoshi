import { exampleWidgetControllerFactory } from './exampleWidgetController';

describe('exampleWidgetControllerFactory', () => {
  it('should call setProps with data', async () => {
    const setPropsSpy = jest.fn();
    const appParams = {
      baseUrls: {
        staticsBaseUrl: 'http://some-static-url.com',
      },
    };
    const locale = 'locale';
    const experiments = { someExperiment: 'true' };

    const controller = await exampleWidgetControllerFactory(
      {
        appParams,
        setProps: setPropsSpy,
      },
    );

    controller.pageReady();

    expect(setPropsSpy).toBeCalledWith({
      name: 'World',
      cssBaseUrl: appParams.baseUrls.staticsBaseUrl,
      locale,
      experiments,
    });
  });
});
