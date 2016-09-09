import { Rack as CoreRack } from 'kinvey-javascript-rack';
import { CacheMiddleware } from './cache';
import { HttpMiddleware } from './http';
import { ParseMiddleware } from './parse';
import { SerializeMiddleware } from './serialize';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import result from 'lodash/result';

class Rack extends CoreRack {
  async execute(request) {
    const { response } = await super.execute(result(request, 'toPlainObject', request));
    return response;
  }
}

export class CacheRack extends Rack {
  constructor(name = 'Cache Rack') {
    super(name);
    this.use(new CacheMiddleware());
  }
}

export class NetworkRack extends Rack {
  constructor(name = 'Network Rack') {
    super(name);
    this.use(new SerializeMiddleware());
    this.use(new HttpMiddleware());
    this.use(new ParseMiddleware());
  }
}
