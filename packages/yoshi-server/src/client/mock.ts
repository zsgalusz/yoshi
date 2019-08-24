import { isEqual } from 'lodash';
import { FunctionArgs, FunctionResult, UnpackPromise, DSL } from '../types';
import { joinUrls } from './utils';
import { HttpClient } from './interface';

type Mock<Result extends FunctionResult, Args extends FunctionArgs> = {
  request: {
    fn: DSL<Result, Args>;
    variables: Args;
  };
  result: UnpackPromise<Result>;
};

export default class implements HttpClient {
  private mocks: Array<Mock<any, any>>;

  constructor(mocks: Array<Mock<any, any>>) {
    this.mocks = mocks;
  }

  async batch(...ts: Array<[DSL<any, any>, FunctionArgs]>) {
    const url = joinUrls('', '/_batch_');

    const data = ts.map(([{ fileName, methodName }, args]) => {
      return { fileName, methodName, args };
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(JSON.stringify(await res.json()));
    }

    return res.json();
  }

  async request<Result extends FunctionResult, Args extends FunctionArgs>(
    dsl: DSL<Result, Args>,
    ...args: Args
  ): Promise<UnpackPromise<Result>> {
    const mock = this.mocks.find(({ request }) => {
      if (request.fn === dsl) {
        return isEqual(args, request.variables);
      }
    });

    if (mock) {
      return mock.result;
    }

    throw new Error('not found');
  }
}
