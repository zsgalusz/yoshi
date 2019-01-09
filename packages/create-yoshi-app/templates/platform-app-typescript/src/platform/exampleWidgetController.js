/* eslint-disable no-unused-vars */
export function exampleWidgetControllerFactory(
  {
    appParams,
    setProps,
    $w,
    wixCodeApi,
    platformApi,
    config,
    compId,
    connections,
    livePreviewMode,
    platformAPIs,
    type,
    warmupData,
  },
  { experiments, translations, locale },
) {
  return {
    pageReady() {
      setProps({
        name: 'World',
        cssBaseUrl: appParams.baseUrls.staticsBaseUrl,
        locale,
        translations,
        experiments,
      });
    },
  };
}
