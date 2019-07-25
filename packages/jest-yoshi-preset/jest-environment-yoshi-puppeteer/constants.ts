import os from 'os';
import path from 'path';

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');

export var WS_ENDPOINT_PATH = path.join(DIR, 'wsEndpoint');
