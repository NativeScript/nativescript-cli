import Rack from 'kinvey-javascript-rack';
import { CacheMiddleware } from './middleware';

export default class CacheRack extends Rack {
  constructor(name = 'Cache Rack') {
    super(name);
    this.use(new CacheMiddleware());
  }
}
