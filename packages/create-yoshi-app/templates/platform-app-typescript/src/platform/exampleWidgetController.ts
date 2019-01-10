import { IWidgetControllerConfig } from '@wix/native-components-infra/dist/src/types/types';

export interface IWidgetProps {
  experiments: any,
  locale: string
}

export function exampleWidgetControllerFactory(controllerConfig: IWidgetControllerConfig, widgetProps: IWidgetProps) {
  const { appParams, setProps } = controllerConfig;
  const { experiments, locale } = widgetProps;
  return {
    pageReady() {
      setProps({
        name: 'World',
        cssBaseUrl: appParams.baseUrls.staticsBaseUrl,
        locale,
        experiments,
      });
    },
  };
}
