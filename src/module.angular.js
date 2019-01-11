import { NgModule, Injectable } from '@angular/core';
// import { HttpClientModule } from '@angular/common/http';

import Acl from './acl';
import * as DataStore from './datastore';
import Kmd from './kmd';
import Query from './query';
import * as Files from './files';
import endpoint from './endpoint';
import Aggregation from './aggregation';
import init from './kinvey/init';
import initialize from './kinvey/initialize';
import { get as getAppVersion, set as setAppVersion } from './kinvey/appVersion';
import User from './user';

@NgModule()
export class KinveyModule { }

export {
  init,
  initialize,
  getAppVersion,
  setAppVersion,

  // Acl
  Acl,

  // Aggregation
  Aggregation,

  // DataStore
  DataStore,
  DataStoreType: DataStore.DataStoreType,

  // Custom Endpoint
  CustomEndpoint: endpoint,

  // Files
  Files,

  // Kmd
  Kmd,
  Metadata: Kmd,

  // Query
  Query,

  // User
  User,
  AuthorizationGrant: User.AuthorizationGrant
};
