import path from 'path';

function getRouteMatcher(routeRegex: ReturnType<typeof getRouteRegex>) {
  const { re, groups } = routeRegex;
  return (pathname: string | undefined) => {
    const routeMatch = re.exec(pathname!);

    if (!routeMatch) {
      return false;
    }

    const params: { [paramName: string]: string } = {};

    Object.keys(groups).forEach((slugName: string) => {
      const m = routeMatch[groups[slugName]];
      if (m !== undefined) {
        params[slugName] = decodeURIComponent(m);
      }
    });

    return params;
  };
}

function getRouteRegex(
  normalizedRoute: string,
): { re: RegExp; groups: { [groupName: string]: number } } {
  // Escape all characters that could be considered RegEx
  const escapedRoute = (normalizedRoute.replace(/\/$/, '') || '/').replace(
    /[|\\{}()[\]^$+*?.-]/g,
    '\\$&',
  );

  const groups: { [groupName: string]: number } = {};
  let groupIndex = 1;

  const parameterizedRoute = escapedRoute.replace(
    /\/\\\[([^/]+?)\\\](?=\/|$)/g,
    (_, $1) => (
      (groups[
        $1
          // Un-escape key
          .replace(/\\([|\\{}()[\]^$+*?.-])/g, '$1')
        // eslint-disable-next-line no-sequences
      ] = groupIndex++),
      '/([^/]+?)'
    ),
  );

  return {
    re: new RegExp('^' + parameterizedRoute + '(?:/)?$', 'i'),
    groups,
  };
}

export function getMatcher(normalizedRoute: string) {
  const regex = getRouteRegex(normalizedRoute);
  const matcher = getRouteMatcher(regex);

  return matcher;
}

export function relativeFilePath(from: string, to: string) {
  return path.relative(from, to.replace(/\.[^/.]+$/, ''));
}

export function get<T, P1 extends keyof NonNullable<T>>(
  obj: T,
  prop1: P1,
): NonNullable<T>[P1] | undefined;

export function get<
  T,
  P1 extends keyof NonNullable<T>,
  P2 extends keyof NonNullable<NonNullable<T>[P1]>
>(
  obj: T,
  prop1: P1,
  prop2: P2,
): NonNullable<NonNullable<T>[P1]>[P2] | undefined;

export function get<
  T,
  P1 extends keyof NonNullable<T>,
  P2 extends keyof NonNullable<NonNullable<T>[P1]>,
  P3 extends keyof NonNullable<NonNullable<NonNullable<T>[P1]>[P2]>
>(
  obj: T,
  prop1: P1,
  prop2: P2,
  prop3: P3,
): NonNullable<NonNullable<NonNullable<T>[P1]>[P2]>[P3] | undefined;

export function get(obj: any, ...props: Array<string>): any {
  return (
    obj &&
    props.reduce(
      (result, prop) => (result == null ? undefined : result[prop]),
      obj,
    )
  );
}
