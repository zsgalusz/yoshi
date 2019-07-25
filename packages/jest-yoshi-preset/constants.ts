const { MATCH_ENV, LATEST_JSDOM } = process.env;

export const envs = MATCH_ENV ? MATCH_ENV.split(',') : null;
export {LATEST_JSDOM as withLatestJSDom};
export const supportedEnvs = ['e2e', 'spec'];
