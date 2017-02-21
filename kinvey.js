import Kinvey, { ParseMiddleware, SerializeMiddleware } from 'kinvey-js-sdk/dist/export';
import {
  HttpMiddleware
} from './middleware';

// Setup racks
Kinvey.NetworkRack.reset();
Kinvey.NetworkRack.use(new SerializeMiddleware());
Kinvey.NetworkRack.use(new HttpMiddleware());
Kinvey.NetworkRack.use(new ParseMiddleware());

// Export
export default Kinvey;
