import PubNub from 'pubnub';

import Client from '../../../client';
import { User } from '../../../entity';
import { PubNubListener } from './pubnub-listener';
import { getLiveService } from './live-service';


function _getLiveService() {
  const client = Client.sharedInstance();
  return getLiveService(client);
}

function register() {
  const liveService = _getLiveService();
  const activeUser = User.getActiveUser();

  return liveService.registerUser(activeUser)
    .then((pubnubConfig) => {
      const pubnubClient = new PubNub(pubnubConfig);
      const listener = new PubNubListener();
      liveService.initialize(pubnubClient, listener);
    });
}

function unregister() {
  const liveService = _getLiveService();
  return liveService.unregisterUser()
    .then((resp) => {
      liveService.uninitialize();
      return resp;
    });
}

function onConnectionStatusUpdates(func) {
  _getLiveService().onConnectionStatusUpdates(func);
}

function offConnectionStatusUpdates(func) {
  _getLiveService().offConnectionStatusUpdates(func);
}

function unsubscribeFromAll() {
  _getLiveService().unsubscribeFromAll();
}

function isInitialized() {
  return _getLiveService().isInitialized();
}

export const LiveServiceFacade = {
  register,
  unregister,
  onConnectionStatusUpdates,
  offConnectionStatusUpdates,
  unsubscribeFromAll,
  isInitialized
};
