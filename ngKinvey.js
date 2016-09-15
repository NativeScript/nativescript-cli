import { NgModule } from '@angular/core';
import { HttpModule, Http } from '@angular/http';
import { NetworkRequest, CacheRequest } from 'kinvey-javascript-sdk-core';
import { CacheRack, NetworkRack } from './rack';
import { Kinvey } from './kinvey';

@NgModule({
  imports: [
    HttpModule
  ],
  providers: [
    Kinvey
  ]
})
export class KinveyModule {
  constructor(http: Http) {
    // Set CacheRequest rack
    CacheRequest.rack = new CacheRack();

    // Set NetworkRequest rack
    NetworkRequest.rack = new NetworkRack('Angular2 Network Rack', http);
  }
}
