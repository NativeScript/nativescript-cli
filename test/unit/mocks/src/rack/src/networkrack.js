import Rack from 'kinvey-javascript-rack';
import { HttpMiddleware, ParseMiddleware, SerializeMiddleware } from './middleware';

export default class NetworkRack extends Rack {
  constructor(name = 'Network Rack') {
    super(name);
    this.use(new SerializeMiddleware());
    this.use(new HttpMiddleware());
    this.use(new ParseMiddleware());
  }
}
