import * as fakeTpaResponse from './fake-tpa-response.json';
//todo: check (window as any)
if ((window as any).Wix && (window as any).Wix.Utils.getViewMode() === 'standalone') {
  (window as any).Wix = new class WixMock {
    modelCache = {};
    siteColors;
    siteTextPresets;
    styleParams;

    constructor() {
      this.siteColors = fakeTpaResponse.res.siteColors;
      this.siteTextPresets = fakeTpaResponse.res.siteTextPresets;
      this.styleParams = fakeTpaResponse.res.style;
    }

    getComponentInfo() {
      return 'componentInfo';
    }

    Utils = {
      getViewMode() {
        return 'standalone';
      },
      getCompId() {
        return 'compId';
      },
      getLocale() {
        return 'en';
      },
      getDeviceType() {
        return 'desktop';
      },
      getInstanceValue() {
        return '';
      },
    };

    Styles = {
      getSiteColors: cb => cb(this.siteColors),
      getSiteTextPresets: cb => cb(this.siteTextPresets),
      getStyleParams: cb => cb(this.styleParams),
      getStyleId: cb => cb('style-jp8ide5x'),
    };
  }();
}
