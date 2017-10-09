import { CacheRack, NetworkRack } from '../../../src/core/request';
import { MobileIdentityConnect } from '../../../src/core/identity';
import { CacheMiddleware, HttpMiddleware } from '../../../src/html5/middleware';
import { Popup } from '../../../src/html5/popup';

before(() => {
  // Setup racks
  CacheRack.useCacheMiddleware(new CacheMiddleware());
  NetworkRack.useHttpMiddleware(new HttpMiddleware());

  // Setup popup
  MobileIdentityConnect.usePopupClass(Popup);
});
