import { useState, useContext, useEffect } from 'react';
import { FunctionArgs, FunctionResult, UnpackPromise, DSL } from '../types';
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
