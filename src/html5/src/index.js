import { CacheRack, NetworkRack } from '../../core/src/request';
import { MobileIdentityConnect } from '../../core/src/entity';
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
