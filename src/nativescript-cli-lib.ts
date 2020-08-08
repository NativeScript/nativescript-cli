

import { bootstrapCliLib } from './nativescript-cli-lib-bootstrap';

const injector = bootstrapCliLib();
export const publicApi = injector.publicApi;
