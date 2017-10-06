import { CacheRack, NetworkRack } from '../core/request';
import { MobileIdentityConnect } from '../core/entity';
import { Kinvey } from './kinvey';
import { CacheMiddleware, HttpMiddleware } from './middleware';
import { Popup } from './popup';

// Setup racks
CacheRack.useCacheMiddleware(new CacheMiddleware());
NetworkRack.useHttpMiddleware(new HttpMiddleware());

// Setup popup
MobileIdentityConnect.usePopupClass(Popup);

// Export
export default Kinvey;
