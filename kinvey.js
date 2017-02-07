import Kinvey from 'kinvey-html5-sdk';
import { ParseMiddleware, SerializeMiddleware } from 'kinvey-node-sdk/dist/export';
import { HttpMiddleware } from './middleware';
import Push from './push';

// Setup racks
Kinvey.NetworkRack.reset();
Kinvey.NetworkRack.use(new SerializeMiddleware());
Kinvey.NetworkRack.use(new HttpMiddleware());
Kinvey.NetworkRack.use(new ParseMiddleware());

// Add Push module to Kinvey
Kinvey.Push = Push;

// Export
export default Kinvey;
