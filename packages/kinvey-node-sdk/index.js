import { MobileIdentityConnect } from '../../src/core/identity';
import { NetworkRack } from '../../src/core/request';
import { NodeHttpMiddleware } from '../../src/node/http';
import pkg from './package.json';

// Setup racks
NetworkRack.useHttpMiddleware(new NodeHttpMiddleware(pkg));

export * from '../../src/core';
