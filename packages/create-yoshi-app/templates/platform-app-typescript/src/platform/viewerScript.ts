import { EXPERIMENTS_SCOPE } from '../config';
import { exampleWidgetControllerFactory} from './exampleWidgetController';
import Experiments from '@wix/wix-experiments';
import {
  ICreateControllers, IWidgetController,
  IWidgetControllerConfig
} from '@wix/native-components-infra/dist/src/types/types';

function getLocale({ wixCodeApi }): string {
  return wixCodeApi.window.locale || 'en';
}

async function getExperimentsByScope(scope: string): Experiments {
  const experiments = new Experiments({
    scope,
  });
  await experiments.ready();
  return experiments.all();
}

function createControllers(controllersConfig: IWidgetControllerConfig): Promise<IWidgetController>[] {
  const controllerConfig = controllersConfig[0];
  const locale = getLocale(controllerConfig);

  return [
    getExperimentsByScope(EXPERIMENTS_SCOPE).then(experiments =>
      exampleWidgetControllerFactory(controllerConfig, {
        experiments,
        locale,
      }),
    ),
  ];
}

export const viewerScript: { createControllers } = {
  createControllers,
};
