import { useState, useContext, useEffect } from 'react';
import { FunctionArgs, FunctionResult, UnpackPromise, DSL } from '../types';
import { HttpClient } from '../client/interface';
import { HttpContext } from './context';

type State<Result> = {
  loading: boolean;
  data?: UnpackPromise<Result> | null;
  error?: Error | null;
};

export function useRequest<
  Result extends FunctionResult,
  Args extends FunctionArgs
>(dsl: DSL<Result, Args>, ...args: Args): State<Result> {
  const context = useContext(HttpContext);

  const [state, setState] = useState<State<Result>>({
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    context!
      .client!.request(dsl, ...args)
      .then(
        data => setState({ ...state, loading: false, data }),
        error => setState({ ...state, loading: false, error }),
      );
  }, []);

  return state;
}

export function useBatch<
  Result1 extends FunctionResult,
  Args1 extends FunctionArgs,
  Result2 extends FunctionResult,
  Args2 extends FunctionArgs
>(
  t1: [DSL<Result1, Args1>, Args1],
  t2: [DSL<Result2, Args2>, Args2],
): State<[UnpackPromise<Result1>, UnpackPromise<Result2>]>;

export function useBatch<
  Result1 extends FunctionResult,
  Args1 extends FunctionArgs,
  Result2 extends FunctionResult,
  Args2 extends FunctionArgs,
  Result3 extends FunctionResult,
  Args3 extends FunctionArgs
>(
  t1: [DSL<Result1, Args1>, Args1],
  t2: [DSL<Result2, Args2>, Args2],
  t3: [DSL<Result3, Args3>, Args3],
): State<
  [UnpackPromise<Result1>, UnpackPromise<Result2>, UnpackPromise<Result3>]
>;

export function useBatch(...ts: Array<[DSL<any, any>, FunctionArgs]>) {
  const context = useContext(HttpContext);

  const [state, setState] = useState<State<any>>({
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    context!
      .client!.batch(...(ts as Parameters<HttpClient['batch']>))
      .then(
        data => setState({ ...state, loading: false, data }),
        error => setState({ ...state, loading: false, error }),
      );
  }, []);

  return state;
}
