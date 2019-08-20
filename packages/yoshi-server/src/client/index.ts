import unfetch from 'isomorphic-unfetch';
import { FunctionArgs, FunctionResult, UnpackPromise, DSL } from '../types';
import { joinUrls } from './utils';

type Options = {
  baseUrl?: string;
};

// https://github.com/developit/unfetch/issues/46
const fetch = unfetch;

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
