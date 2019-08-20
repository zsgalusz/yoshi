import unfetch from 'isomorphic-unfetch';
import { FunctionArgs, FunctionResult, UnpackPromise, DSL } from './types';

type Options = {
  baseUrl?: string;
};

function joinUrls(baseUrl: string, relativeUrl: string) {
  return baseUrl.replace(/\/+$/, '') + '/' + relativeUrl.replace(/^\/+/, '');
}

// https://github.com/developit/unfetch/issues/46
const fetch = unfetch;

// const isBrowser = typeof process === 'undefined';

// function readCookie(name: string) {
//   const match = document.cookie.match(
//     new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'),
//   );

//   return match ? decodeURIComponent(match[3]) : null;
// }

export function create({ baseUrl = '/' }: Options = {}) {
  return {
    async request<Result extends FunctionResult, Args extends FunctionArgs>(
      { fileName, methodName }: DSL<Args, Result>,
      ...args: Args
    ): Promise<UnpackPromise<Result>> {
      const url = joinUrls(baseUrl, '/_api_');

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          methodName,
          args,
        }),
      });

      const json = await res.json();

      if (res.status === 500) {
        console.log(json);
      }

      return json;
    },
  };
}
