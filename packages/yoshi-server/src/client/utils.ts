export const isBrowser = typeof process === 'undefined';

export function readCookie(name: string) {
  const match = document.cookie.match(
    new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'),
  );

  return match ? decodeURIComponent(match[3]) : null;
}

export function joinUrls(baseUrl: string, relativeUrl: string) {
  return baseUrl.replace(/\/+$/, '') + '/' + relativeUrl.replace(/^\/+/, '');
}
