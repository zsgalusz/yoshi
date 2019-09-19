declare module 'externals';
declare module '*.unknown' {
  const _: any;
  export = _;
}

interface Window {
  __LOCALE__: string;
  __BASEURL__: string;
  __CI_APP_VERSION__: string;
}
