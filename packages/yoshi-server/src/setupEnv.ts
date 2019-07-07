import testkit from '@wix/wix-bootstrap-testkit';
import configEmitter from '@wix/wix-config-emitter';
import petriTestkit from '@wix/wix-petri-testkit';

export default async ({
  experiments = {},
  config,
}: {
  experiments?: { [name: string]: any };
  config?: (emitter: any) => Promise<void>;
} = {}) => {
  // Initialize config emitter
  const emitter = configEmitter();

  emitter
    // Define defaults
    .val('scripts_domain', 'static.parastorage.com');

  if (config) {
    await config(emitter);
  }

  await emitter.emit();

  // Initialize Petri server
  const petriServer = petriTestkit.server();

  petriServer.onConductAllInScope(() => experiments);

  await petriServer.start();

  // Initialize app server
  const app = testkit.server(
    require.resolve('./index'),
    // @ts-ignore
    { env: process.env },
  );

  await app.start();

  return {
    app,
    petriServer,
  };
};
