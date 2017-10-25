import * as SDK from './index';

// Hoist Kinvey properties to the top
const Kinvey = Object.assign(SDK, SDK.Kinvey);
delete Kinvey.Kinvey;

// Export
export default Kinvey;
