import setupEnv from './setupEnv';

setupEnv({
  experiments: {
    hello: 'world',
  },
  config: async emitter => {
    emitter.val('hello', 'world');
  },
});
