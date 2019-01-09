import { EXPERIMENTS_SCOPE } from '../config';
import { exampleWidgetControllerFactory } from './exampleWidgetController';
import Experiments from '@wix/wix-experiments';

function getLocale({ wixCodeApi }) {
  return wixCodeApi.window.locale || 'en';
}

async function getExperimentsByScope(scope) {
  const experiments = new Experiments({
    scope,
  });
  await experiments.ready();
  return experiments.all();
}

function createControllers(controllersConfig) {
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

export const viewerScript = {
  createControllers,
};
